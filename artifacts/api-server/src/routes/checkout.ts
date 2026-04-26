import { Router, type IRouter } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import { logger } from "../lib/logger";
import { db, orders } from "@workspace/db";
import { sendOrderConfirmation, sendDonationReceipt } from "../lib/email";
import { generateTrackingNumber } from "./orders";
import { randomUUID } from "crypto";

const router: IRouter = Router();

interface CartItem {
  name: string;
  description?: string;
  priceUSD: number;
  quantity: number;
  image?: string;
}

const CAUSE_LABELS: Record<string, string> = {
  general: "EuthList General Rescue Fund",
  medical: "Medical & Vet Care Fund",
  shelter: "Shelter & Housing Support",
  rescue: "Rescue Operations Fund",
};

/**
 * POST /api/checkout/stripe-session
 * Creates a Stripe Checkout Session for the given cart items or donations.
 * Returns { url } — redirect the browser to this URL.
 */
router.post("/checkout/stripe-session", async (req, res) => {
  try {
    const { items, customerEmail, origin, metadata } = req.body as {
      items: CartItem[];
      customerEmail?: string;
      origin?: string;
      metadata?: Record<string, string>;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No cart items provided." });
    }

    const stripe = await getUncachableStripeClient();

    const isMonthlyDonation = metadata?.type === "donation" && metadata?.frequency === "monthly";
    const isDonation = metadata?.type === "donation";
    const baseUrl = origin || `${req.protocol}://${req.get("host")}`;

    let session: any;

    if (isMonthlyDonation) {
      // Stripe subscription mode for recurring donations
      const lineItems = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
          },
          unit_amount: Math.round(item.priceUSD * 100),
          recurring: { interval: "month" as const },
        },
        quantity: item.quantity,
      }));
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "subscription",
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        ...(metadata ? { metadata } : {}),
        subscription_data: { metadata: metadata ?? {} },
        success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/donate`,
      });
    } else {
      // One-time payment for orders and one-off donations
      const lineItems = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
            ...(item.image ? { images: [item.image] } : {}),
          },
          unit_amount: Math.round(item.priceUSD * 100),
        },
        quantity: item.quantity,
      }));
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        ...(metadata ? { metadata } : {}),
        success_url: isDonation
          ? `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: isDonation ? `${baseUrl}/donate` : `${baseUrl}/checkout`,
      });
    }

    logger.info({ sessionId: session.id }, "Stripe checkout session created");
    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    logger.error({ err: error }, "Stripe checkout error");
    if (error.message?.includes("not configured") || error.message?.includes("not set")) {
      return res.status(503).json({
        error: "Payment provider not configured. Please connect Stripe in the admin settings.",
      });
    }
    res.status(500).json({ error: "Failed to create payment session. Please try again." });
  }
});

/**
 * GET /api/checkout/stripe-session/:sessionId
 * Verify a completed checkout session (used on success page).
 * Also saves the order to the database and sends confirmation email.
 */
router.get("/checkout/stripe-session/:sessionId", async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ["line_items"],
    });

    // Normalise subscription sessions so frontend sees "paid"
    const effectiveStatus =
      session.payment_status === "paid" ||
      (session.status === "complete" && session.mode === "subscription")
        ? "paid"
        : session.payment_status;

    const result = {
      status: effectiveStatus,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      isRecurring: session.mode === "subscription",
    };

    // Persist order to DB and send email if paid
    // Subscriptions: status="complete", payment_status="paid" on first charge
    // One-time:      payment_status="paid"
    const isConfirmed =
      session.payment_status === "paid" ||
      (session.status === "complete" && session.mode === "subscription");

    if (isConfirmed && session.id) {
      const type = session.metadata?.type === "donation" ? "donation" : "order";
      const lineItems = session.line_items?.data?.map(li => ({
        name: li.description,
        amount: li.amount_total,
        quantity: li.quantity,
      })) ?? [];

      // Generate tracking number and initial event for orders (not donations)
      let trackingNumber: string | null = null;
      let trackingEvents: string = "[]";
      if (type === "order") {
        trackingNumber = generateTrackingNumber();
        const initialEvent = {
          id: randomUUID(),
          status: "processing",
          message: "Your order has been confirmed and is being prepared.",
          location: "London, UK",
          timestamp: new Date().toISOString(),
        };
        trackingEvents = JSON.stringify([initialEvent]);
      }

      // Save to DB
      try {
        await db.insert(orders).values({
          sessionId: session.id,
          type,
          customerEmail: session.customer_email || null,
          amountUSD: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "paid",
          items: JSON.stringify(lineItems),
          metadata: JSON.stringify(session.metadata || {}),
          trackingNumber,
          trackingEvents,
        }).onConflictDoNothing();
      } catch (dbErr) {
        logger.warn({ err: dbErr }, "Could not save order to DB (non-fatal)");
      }

      // Build tracking URL
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get("host")}`;
      const trackingUrl = trackingNumber ? `${baseUrl}/track/${trackingNumber}` : null;

      // Send confirmation email
      if (session.customer_email) {
        try {
          if (type === "donation") {
            const shelterKey = session.metadata?.shelter ?? "general";
            await sendDonationReceipt({
              to: session.customer_email,
              donorName: session.metadata?.donor || "Friend",
              amountTotal: session.amount_total || 0,
              currency: session.currency || "usd",
              causeLabel: CAUSE_LABELS[shelterKey] ?? shelterKey,
              message: session.metadata?.message || "",
              sessionId: session.id,
              frequency: (session.metadata?.frequency as "once" | "monthly") || "once",
            });
          } else {
            await sendOrderConfirmation({
              to: session.customer_email,
              amountTotal: session.amount_total || 0,
              currency: session.currency || "usd",
              items: lineItems as any,
              sessionId: session.id,
              trackingNumber: trackingNumber ?? undefined,
              trackingUrl: trackingUrl ?? undefined,
            });
          }
        } catch (emailErr) {
          logger.warn({ err: emailErr }, "Could not send confirmation email (non-fatal)");
        }
      }
    }

    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Stripe session retrieval error");
    res.status(500).json({ error: "Could not verify payment status." });
  }
});

export default router;
