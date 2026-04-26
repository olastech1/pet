import { Router, type IRouter } from "express";
import { db, orders, storeSettings } from "@workspace/db";
import { desc, eq, gte, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { randomUUID, randomBytes } from "crypto";

export function generateTrackingNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(9);
  for (let i = 0; i < 9; i++) code += chars[bytes[i] % chars.length];
  return `PG${code}`;
}

const router: IRouter = Router();

/**
 * POST /api/orders/save
 * Called internally when a Stripe session is confirmed paid.
 * Idempotent — skips if sessionId already exists.
 */
router.post("/orders/save", async (req, res) => {
  const { sessionId, type, customerEmail, amountUSD, currency, status, items, metadata } = req.body;
  if (!sessionId || !type || amountUSD == null) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  try {
    await db.insert(orders).values({
      sessionId,
      type,
      customerEmail: customerEmail || null,
      amountUSD: Math.round(amountUSD),
      currency: currency || "usd",
      status: status || "paid",
      items: typeof items === "string" ? items : JSON.stringify(items || []),
      metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata || {}),
    }).onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Error saving order");
    res.status(500).json({ error: "Failed to save order." });
  }
});

/**
 * GET /api/orders
 * Returns all orders for admin, newest first.
 */
router.get("/orders", async (_req, res) => {
  try {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Error fetching orders");
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

/**
 * GET /api/orders/stats
 * Returns aggregate stats for the admin dashboard.
 */
router.get("/orders/stats", async (_req, res) => {
  try {
    const all = await db.select().from(orders);

    const purchases = all.filter(o => o.type === "order");
    const donations = all.filter(o => o.type === "donation");
    const totalRevenue = purchases.reduce((s, o) => s + o.amountUSD, 0);
    const totalDonations = donations.reduce((s, o) => s + o.amountUSD, 0);

    // Last 7 days breakdown by day
    const now = new Date();
    const days: { date: string; orders: number; donations: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders = purchases.filter(o => o.createdAt.toISOString().slice(0, 10) === dayStr);
      const dayDonations = donations.filter(o => o.createdAt.toISOString().slice(0, 10) === dayStr);
      days.push({
        date: label,
        orders: dayOrders.length,
        donations: dayDonations.length,
        revenue: dayOrders.reduce((s, o) => s + o.amountUSD, 0),
      });
    }

    res.json({
      totalOrders: purchases.length,
      totalDonations: donations.length,
      totalRevenue,
      totalDonationAmount: totalDonations,
      recentDays: days,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching order stats");
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

/**
 * GET /api/orders/by-email?email=...
 * Returns orders for a specific customer email (public lookup).
 */
router.get("/orders/by-email", async (req, res) => {
  const email = (req.query.email as string || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required." });
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(sql`lower(${orders.customerEmail})`, email))
      .orderBy(desc(orders.createdAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Error fetching orders by email");
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

/**
 * GET /api/orders/track/:trackingNumber
 * Public endpoint — look up an order by tracking number (no email needed).
 */
router.get("/orders/track/:trackingNumber", async (req, res) => {
  const { trackingNumber } = req.params;
  if (!trackingNumber) return res.status(400).json({ error: "Tracking number required" });
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.trackingNumber, trackingNumber.toUpperCase()))
      .limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    // Return limited public data only
    res.json({
      id: order.id,
      trackingNumber: order.trackingNumber,
      trackingEvents: order.trackingEvents,
      status: order.status,
      items: order.items,
      type: order.type,
      createdAt: order.createdAt,
      customerEmail: order.customerEmail
        ? order.customerEmail.replace(/(.{2}).*(@.*)/, "$1***$2")
        : null,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching order by tracking number");
    res.status(500).json({ error: "Failed to fetch order." });
  }
});

/**
 * PATCH /api/orders/:id/tracking
 * Admin updates tracking for an order.
 * Body: { trackingNumber?: string, status: string, message?: string, location?: string }
 */
router.patch("/orders/:id/tracking", async (req, res) => {
  const { id } = req.params;
  const { trackingNumber, status, message, location } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });

    let events: any[] = [];
    try { events = JSON.parse(order.trackingEvents || "[]"); } catch {}

    const newEvent = {
      id: randomUUID(),
      status,
      message: message || "",
      location: location || "",
      timestamp: new Date().toISOString(),
    };
    events.push(newEvent);

    await db.update(orders)
      .set({
        trackingEvents: JSON.stringify(events),
        ...(trackingNumber !== undefined && { trackingNumber }),
      })
      .where(eq(orders.id, id));

    res.json({ ok: true, event: newEvent });
  } catch (err) {
    logger.error({ err }, "Error updating tracking");
    res.status(500).json({ error: "Failed to update tracking." });
  }
});

/**
 * DELETE /api/orders/:id/tracking/:eventId
 * Admin removes a specific tracking event.
 */
router.delete("/orders/:id/tracking/:eventId", async (req, res) => {
  const { id, eventId } = req.params;
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });

    let events: any[] = [];
    try { events = JSON.parse(order.trackingEvents || "[]"); } catch {}
    events = events.filter((e: any) => e.id !== eventId);

    await db.update(orders).set({ trackingEvents: JSON.stringify(events) }).where(eq(orders.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Error deleting tracking event");
    res.status(500).json({ error: "Failed to delete tracking event." });
  }
});

/**
 * PATCH /api/orders/:id/tracking-number
 * Admin sets/clears the tracking number.
 */
router.patch("/orders/:id/tracking-number", async (req, res) => {
  const { id } = req.params;
  const { trackingNumber } = req.body;
  try {
    await db.update(orders).set({ trackingNumber: trackingNumber || null }).where(eq(orders.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tracking number." });
  }
});

/**
 * POST /api/orders/manual
 * Admin logs a WhatsApp or Telegram (or other manual) order into the system.
 * Auto-generates a tracking number and initial processing event.
 */
router.post("/orders/manual", async (req, res) => {
  const {
    type,          // "order" | "donation"
    customerEmail,
    customerName,
    items,         // [{ name, quantity, priceUSD }]
    amountUSD,     // in cents
    currency,
    notes,
    paymentStatus, // "paid" | "pending"
    cause,         // for donations
    frequency,     // "once" | "monthly" — for donations
    platform,      // "whatsapp" | "telegram"
  } = req.body;

  const source = platform === "telegram" ? "telegram" : "whatsapp";

  if (!type || amountUSD == null) {
    return res.status(400).json({ error: "type and amountUSD are required." });
  }

  try {
    const sessionId = `${source}-${randomUUID()}`;
    const trackingNumber = type === "order" ? generateTrackingNumber() : null;
    const platformLabel = source === "telegram" ? "Telegram" : "WhatsApp";
    const initialEvent = trackingNumber
      ? JSON.stringify([{
          id: randomUUID(),
          status: "processing",
          message: `Order received via ${platformLabel} and is being prepared.`,
          location: "London, UK",
          timestamp: new Date().toISOString(),
        }])
      : "[]";

    const itemsArr = Array.isArray(items) ? items : [];
    const metaObj: Record<string, string> = {
      source,
      ...(customerName ? { customerName } : {}),
      ...(notes ? { notes } : {}),
      ...(cause ? { shelter: cause } : {}),
      ...(frequency ? { frequency } : {}),
    };

    const [inserted] = await db.insert(orders).values({
      sessionId,
      type,
      customerEmail: customerEmail || null,
      amountUSD: Math.round(amountUSD),
      currency: currency || "usd",
      status: paymentStatus || "paid",
      items: JSON.stringify(itemsArr.map((i: any) => ({
        name: i.name || "Item",
        amount: Math.round((i.priceUSD ?? 0) * 100 * (i.quantity ?? 1)),
        quantity: i.quantity ?? 1,
      }))),
      metadata: JSON.stringify(metaObj),
      trackingNumber,
      trackingEvents: initialEvent,
    }).returning();

    logger.info({ orderId: inserted.id, type, sessionId }, "Manual order logged");
    res.json({ ok: true, order: inserted });
  } catch (err) {
    logger.error({ err }, "Error logging manual order");
    res.status(500).json({ error: "Failed to log order." });
  }
});

export default router;
