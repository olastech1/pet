/**
 * PawGlobal — Vercel Serverless API
 * ===================================
 * This file exports the Express app as a Vercel serverless function.
 * All /api/* routes are handled here. Static files are served by Vercel CDN.
 *
 * Local development: node api/index.js  (starts on PORT 3001)
 * Production: Deployed automatically by Vercel
 */

"use strict";

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const { Pool }   = require("pg");
const Stripe     = require("stripe");
const nodemailer = require("nodemailer");
const crypto     = require("crypto");

// ────────────────────────────────────────────────────────────
// 1. Configuration
// ────────────────────────────────────────────────────────────

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error("❌  DATABASE_URL is not set. Please check your environment variables.");
}

// ────────────────────────────────────────────────────────────
// 2. PostgreSQL Pool
// ────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: DB_URL || "",
  ssl: DB_URL && (DB_URL.includes("localhost") || DB_URL.includes("127.0.0.1"))
    ? false
    : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err.message);
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// ────────────────────────────────────────────────────────────
// 3. DB Helpers
// ────────────────────────────────────────────────────────────

const ALLOWED_SETTINGS = [
  "storeName", "contactEmail", "phone", "address",
  "notificationEmail", "notifyOnOrder", "notifyOnAdoption", "notifyOnDonation",
  "stripePublishableKey", "stripeSecretKey",
  "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "smtpFromName", "smtpFromEmail",
  "page_privacy", "page_terms", "page_shipping",
  "checkoutMethod", "whatsappNumber", "telegramUsername",
];

const SECRET_SETTINGS = new Set(["stripeSecretKey", "smtpPassword"]);

async function getAllSettings() {
  const { rows } = await query("SELECT key, value FROM store_settings");
  const map = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

async function getSetting(key) {
  const { rows } = await query("SELECT value FROM store_settings WHERE key = $1", [key]);
  return rows[0]?.value || null;
}

async function upsertSetting(key, value) {
  await query(
    `INSERT INTO store_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  );
}

// ────────────────────────────────────────────────────────────
// 4. Stripe Helper
// ────────────────────────────────────────────────────────────

async function getStripeClient() {
  const dbKey = await getSetting("stripeSecretKey");
  const secretKey = (dbKey && dbKey.length > 10) ? dbKey : process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key is not configured.");
  return new Stripe(secretKey, { apiVersion: "2023-10-16" });
}

// ────────────────────────────────────────────────────────────
// 5. Email Helpers
// ────────────────────────────────────────────────────────────

async function getSmtpConfig() {
  const s = await getAllSettings();
  return {
    host:      s.smtpHost      || process.env.SMTP_HOST      || "",
    port:      parseInt(s.smtpPort || process.env.SMTP_PORT || "587"),
    user:      s.smtpUser      || process.env.SMTP_USER      || "",
    pass:      s.smtpPassword  || process.env.SMTP_PASSWORD  || "",
    fromName:  s.smtpFromName  || process.env.SMTP_FROM_NAME  || "PawGlobal",
    fromEmail: s.smtpFromEmail || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
  };
}

async function createSmtpTransport() {
  const cfg = await getSmtpConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) return null;
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
  });
}

async function sendEmail({ to, subject, html }) {
  const cfg = await getSmtpConfig();
  const transport = await createSmtpTransport();
  if (!transport) return;
  try {
    await transport.sendMail({ from: `"${cfg.fromName}" <${cfg.fromEmail}>`, to, subject, html });
    console.log(`Email sent → ${to}`);
  } catch (err) {
    console.warn("Email failed:", err.message);
  }
}

function emailBase(content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
body{margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a}
.w{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.h{background:#c0392b;padding:32px 40px;text-align:center}
.h h1{margin:0;color:#fff;font-size:26px;font-weight:700}
.b{padding:36px 40px}
.b h2{margin:0 0 16px;font-size:22px;font-weight:700}
.b p{margin:0 0 14px;line-height:1.65;color:#444;font-size:15px}
.box{background:#faf9f7;border:1px solid #e8e4df;border-radius:10px;padding:20px 24px;margin:20px 0}
.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #ede9e4;font-size:14px}
.row:last-child{border-bottom:none}
.row .l{color:#888}.row .v{font-weight:600;color:#1a1a1a}
.f{background:#f5f4f0;padding:20px 40px;text-align:center;font-size:12px;color:#999}
</style></head><body><div class="w">
<div class="h"><h1>🐾 PawGlobal</h1><p>Global Pet Sanctuary · London, UK</p></div>
<div class="b">${content}</div>
<div class="f"><p>PawGlobal · 1 Global Sanctuary Plaza, London, United Kingdom · hello@pawglobal.com</p></div>
</div></body></html>`;
}

async function sendOrderConfirmationEmail({ to, amountTotal, currency, items, trackingNumber }) {
  const curr = currency.toUpperCase();
  const amount = (amountTotal / 100).toFixed(2);
  const itemRows = Array.isArray(items) ? items.map(i =>
    `<div class="row"><span class="l">${i.name} ×${i.quantity ?? 1}</span><span class="v">${curr} ${((i.amount || 0) / 100).toFixed(2)}</span></div>`
  ).join("") : "";
  const trackBadge = trackingNumber
    ? `<div style="background:#fff8f0;border:1px solid #f5c89a;border-radius:10px;padding:14px 18px;margin:18px 0;text-align:center">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#c0392b">📦 Tracking Number</p>
        <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:3px">${trackingNumber}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#888">Track your order at pawglobal.com/track</p></div>` : "";
  await sendEmail({
    to,
    subject: `Your PawGlobal order is confirmed — ${curr} ${amount} 🐾`,
    html: emailBase(`
      <h2>Order Confirmed! 🎉</h2>
      <p>Thank you for your purchase. We're preparing your order now.</p>
      <div class="box">${itemRows}
        <div class="row"><span class="l">Total</span><span class="v">${curr} ${amount}</span></div>
      </div>
      ${trackBadge}
      <p>We'll update your tracking status as your order progresses. Expected delivery: 5–10 business days.</p>
      <p>With love,<br/><strong>The PawGlobal Team</strong></p>
    `),
  });
}

async function sendDonationReceiptEmail({ to, donorName, amountTotal, currency, causeLabel, isMonthly }) {
  const curr = currency.toUpperCase();
  const amount = (amountTotal / 100).toFixed(2);
  await sendEmail({
    to,
    subject: isMonthly
      ? `Monthly donation confirmed — ${curr} ${amount}/month 🔄🐾`
      : `Your PawGlobal donation receipt — ${curr} ${amount} 🐾`,
    html: emailBase(`
      <h2>${isMonthly ? "Monthly Donation Active! 🔄❤️" : "Thank You for Donating! ❤️"}</h2>
      <p>Dear ${donorName}, your generosity makes a real difference.</p>
      <div class="box">
        <div class="row"><span class="l">Donated to</span><span class="v">${causeLabel}</span></div>
        <div class="row"><span class="l">Amount</span><span class="v">${curr} ${amount}${isMonthly ? " / month" : ""}</span></div>
        <div class="row"><span class="l">Frequency</span><span class="v">${isMonthly ? "Monthly recurring" : "One-time"}</span></div>
      </div>
      <p>100% of your donation goes directly to our partner rescue centres — no overhead cuts.</p>
      <p>With gratitude,<br/><strong>The PawGlobal Team</strong></p>
    `),
  });
}

// ────────────────────────────────────────────────────────────
// 6. Tracking Number Generator
// ────────────────────────────────────────────────────────────

function generateTrackingNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(9);
  for (let i = 0; i < 9; i++) code += chars[bytes[i] % chars.length];
  return `PG${code}`;
}

// ────────────────────────────────────────────────────────────
// 7. Utility
// ────────────────────────────────────────────────────────────

function camelizeOrder(row) {
  return {
    id:              row.id,
    sessionId:       row.session_id,
    type:            row.type,
    customerEmail:   row.customer_email,
    amountUSD:       row.amount_usd,
    currency:        row.currency,
    status:          row.status,
    items:           row.items,
    metadata:        row.metadata,
    trackingNumber:  row.tracking_number,
    trackingEvents:  row.tracking_events,
    createdAt:       row.created_at,
  };
}

// ────────────────────────────────────────────────────────────
// 8. Express App
// ────────────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ────────────────────────────────────────────────────────────
// 9. API Routes
// ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.get("/api/settings", async (req, res) => {
  try {
    const settings = await getAllSettings();
    const includeSecrets = req.query.includeSecrets === "true";
    const result = {};
    for (const [k, v] of Object.entries(settings)) {
      result[k] = (!includeSecrets && SECRET_SETTINGS.has(k)) ? (v ? "••••••••" : "") : v;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings." });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const updates = req.body;
    const saved = [];
    for (const [k, v] of Object.entries(updates)) {
      if (ALLOWED_SETTINGS.includes(k)) {
        await upsertSetting(k, String(v));
        saved.push(k);
      }
    }
    res.json({ success: true, saved });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings." });
  }
});

app.get("/api/settings/stripe-status", async (_req, res) => {
  try {
    const dbKey = await getSetting("stripeSecretKey");
    const hasDbKey = !!(dbKey && dbKey.length > 10);
    const hasEnvKey = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 10);
    const connected = hasDbKey || hasEnvKey;
    res.json({ stripe: { connected, source: hasDbKey ? "custom" : hasEnvKey ? "env" : "none" } });
  } catch (err) {
    res.status(500).json({ error: "Failed to check Stripe status." });
  }
});

app.get("/api/settings/smtp-status", async (_req, res) => {
  try {
    const cfg = await getSmtpConfig();
    const configured = !!(cfg.host && cfg.user && cfg.pass);
    res.json({ smtp: { configured, host: cfg.host || null } });
  } catch (err) {
    res.status(500).json({ error: "Failed to check SMTP status." });
  }
});

app.post("/api/settings/test-smtp", async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: "to email is required." });
    const transport = await createSmtpTransport();
    if (!transport) return res.status(400).json({ error: "SMTP is not configured." });
    const cfg = await getSmtpConfig();
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject: "PawGlobal — SMTP Test Email ✓",
      html: emailBase(`<h2>SMTP Test Successful ✓</h2>
        <p>Your email settings are working correctly.</p>
        <p style="color:#888;font-size:13px">Sent from the PawGlobal admin panel.</p>`),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send test email." });
  }
});

app.get("/api/settings/checkout-method", async (_req, res) => {
  try {
    const s = await getAllSettings();
    res.json({
      method: s.checkoutMethod || "stripe",
      whatsappNumber: s.whatsappNumber || "",
      telegramUsername: s.telegramUsername || "",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get checkout method." });
  }
});

app.get("/api/settings/donation-method", async (_req, res) => {
  try {
    const s = await getAllSettings();
    res.json({
      stripe: {
        enabled: s.donationStripeEnabled === "true",
      },
      whatsapp: {
        enabled: s.donationWhatsappEnabled === "true",
        number: s.donationWhatsappNumber || s.whatsappNumber || "",
      },
      paypal: {
        enabled: s.donationPaypalEnabled === "true",
        link: s.paypalLink || "",
      },
      gofundme: {
        enabled: s.donationGofundmeEnabled === "true",
        link: s.gofundmeLink || "",
      },
      telegram: {
        enabled: s.donationTelegramEnabled === "true",
        username: s.donationTelegramUsername || s.telegramUsername || "",
      },
      crypto: {
        enabled: s.donationCryptoEnabled === "true",
        address: s.donationCryptoAddress || "",
        network: s.donationCryptoNetwork || "Bitcoin",
        coin: s.donationCryptoCoin || "BTC",
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get donation method." });
  }
});

app.post("/api/checkout/stripe-session", async (req, res) => {
  try {
    const { items, customerEmail, origin, metadata } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No cart items provided." });
    }
    const stripe = await getStripeClient();
    const isMonthly = metadata?.type === "donation" && metadata?.frequency === "monthly";
    const isDonation = metadata?.type === "donation";
    const baseUrl = origin || `${req.protocol}://${req.get("host")}`;

    let session;
    if (isMonthly) {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map(i => ({
          price_data: {
            currency: "usd",
            product_data: { name: i.name },
            unit_amount: Math.round(i.priceUSD * 100),
            recurring: { interval: "month" },
          },
          quantity: i.quantity,
        })),
        mode: "subscription",
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        ...(metadata ? { metadata } : {}),
        subscription_data: { metadata: metadata ?? {} },
        success_url: `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/donate`,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map(i => ({
          price_data: {
            currency: "usd",
            product_data: { name: i.name, ...(i.image ? { images: [i.image] } : {}) },
            unit_amount: Math.round(i.priceUSD * 100),
          },
          quantity: i.quantity,
        })),
        mode: "payment",
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        ...(metadata ? { metadata } : {}),
        success_url: isDonation
          ? `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: isDonation ? `${baseUrl}/donate` : `${baseUrl}/checkout`,
      });
    }
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe session error:", err.message);
    if (err.message?.includes("not configured")) {
      return res.status(503).json({ error: "Payment provider not configured. Add Stripe keys in Admin Settings." });
    }
    res.status(500).json({ error: "Failed to create payment session." });
  }
});

app.get("/api/checkout/stripe-session/:sessionId", async (req, res) => {
  try {
    const stripe = await getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ["line_items"],
    });
    const result = {
      status: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    };

    if (session.payment_status === "paid") {
      const type = session.metadata?.type === "donation" ? "donation" : "order";
      const lineItems = (session.line_items?.data || []).map(i => ({
        name: i.description,
        amount: i.amount_total,
        quantity: i.quantity,
      }));
      const trackingNumber = type === "order" ? generateTrackingNumber() : null;
      const trackingEvents = trackingNumber
        ? JSON.stringify([{
            id: crypto.randomUUID(),
            status: "processing",
            message: "Order confirmed and is being prepared for shipment.",
            location: "London, UK",
            timestamp: new Date().toISOString(),
          }])
        : "[]";

      try {
        await query(
          `INSERT INTO orders (id, session_id, type, customer_email, amount_usd, currency, status, items, metadata, tracking_number, tracking_events, created_at)
           VALUES (gen_random_uuid()::TEXT, $1, $2, $3, $4, $5, 'paid', $6, $7, $8, $9, NOW())
           ON CONFLICT (session_id) DO NOTHING`,
          [
            session.id, type,
            session.customer_email || null,
            session.amount_total || 0,
            session.currency || "usd",
            JSON.stringify(lineItems),
            JSON.stringify(session.metadata || {}),
            trackingNumber,
            trackingEvents,
          ]
        );
      } catch (dbErr) {
        console.warn("Could not save order:", dbErr.message);
      }

      if (session.customer_email) {
        try {
          if (type === "donation") {
            const CAUSES = {
              general: "PawGlobal General Rescue Fund",
              medical: "Medical & Vet Care Fund",
              shelter: "Shelter & Housing Support",
              rescue: "Rescue Operations Fund",
            };
            await sendDonationReceiptEmail({
              to: session.customer_email,
              donorName: session.metadata?.donor || "Friend",
              amountTotal: session.amount_total || 0,
              currency: session.currency || "usd",
              causeLabel: CAUSES[session.metadata?.shelter] ?? session.metadata?.shelter ?? "General Rescue",
              isMonthly: session.metadata?.frequency === "monthly",
            });
          } else {
            await sendOrderConfirmationEmail({
              to: session.customer_email,
              amountTotal: session.amount_total || 0,
              currency: session.currency || "usd",
              items: lineItems,
              trackingNumber,
            });
          }
        } catch (emailErr) {
          console.warn("Could not send email:", emailErr.message);
        }
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Stripe verify error:", err.message);
    res.status(500).json({ error: "Could not verify payment status." });
  }
});

app.post("/api/orders/save", async (req, res) => {
  const { sessionId, type, customerEmail, amountUSD, currency, status, items, metadata } = req.body;
  if (!sessionId || !type || amountUSD == null) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  try {
    await query(
      `INSERT INTO orders (id, session_id, type, customer_email, amount_usd, currency, status, items, metadata, created_at)
       VALUES (gen_random_uuid()::TEXT, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (session_id) DO NOTHING`,
      [sessionId, type, customerEmail || null, Math.round(amountUSD),
       currency || "usd", status || "paid",
       typeof items === "string" ? items : JSON.stringify(items || []),
       typeof metadata === "string" ? metadata : JSON.stringify(metadata || {})]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save order." });
  }
});

app.get("/api/orders", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200");
    res.json(rows.map(camelizeOrder));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

app.get("/api/orders/stats", async (_req, res) => {
  try {
    const { rows: all } = await query("SELECT * FROM orders");
    const purchases = all.filter(o => o.type === "order");
    const donations = all.filter(o => o.type === "donation");
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders    = purchases.filter(o => new Date(o.created_at).toISOString().slice(0, 10) === dayStr);
      const dayDonations = donations.filter(o => new Date(o.created_at).toISOString().slice(0, 10) === dayStr);
      days.push({
        date: label,
        orders: dayOrders.length,
        donations: dayDonations.length,
        revenue: dayOrders.reduce((s, o) => s + o.amount_usd, 0),
      });
    }
    res.json({
      totalOrders: purchases.length,
      totalDonations: donations.length,
      totalRevenue: purchases.reduce((s, o) => s + o.amount_usd, 0),
      totalDonationAmount: donations.reduce((s, o) => s + o.amount_usd, 0),
      recentDays: days,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

app.get("/api/orders/by-email", async (req, res) => {
  const email = (req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email required." });
  try {
    const { rows } = await query(
      "SELECT * FROM orders WHERE lower(customer_email) = $1 ORDER BY created_at DESC",
      [email]
    );
    res.json(rows.map(camelizeOrder));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

app.get("/api/orders/track/:trackingNumber", async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM orders WHERE tracking_number = $1 LIMIT 1",
      [req.params.trackingNumber.toUpperCase()]
    );
    if (!rows[0]) return res.status(404).json({ error: "Order not found." });
    const o = camelizeOrder(rows[0]);
    res.json({
      id: o.id,
      trackingNumber: o.trackingNumber,
      trackingEvents: o.trackingEvents,
      status: o.status,
      items: o.items,
      type: o.type,
      createdAt: o.createdAt,
      customerEmail: o.customerEmail
        ? o.customerEmail.replace(/(.{2}).*(@.*)/, "$1***$2")
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order." });
  }
});

app.patch("/api/orders/:id/tracking", async (req, res) => {
  const { status, message, location, trackingNumber } = req.body;
  if (!status) return res.status(400).json({ error: "status is required." });
  try {
    const { rows } = await query("SELECT * FROM orders WHERE id = $1 LIMIT 1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Order not found." });

    let events = [];
    try { events = JSON.parse(rows[0].tracking_events || "[]"); } catch {}
    const newEvent = {
      id: crypto.randomUUID(),
      status,
      message: message || "",
      location: location || "",
      timestamp: new Date().toISOString(),
    };
    events.push(newEvent);

    const updateFields = [
      `tracking_events = $1`,
      `status = $2`,
    ];
    const values = [JSON.stringify(events), status];

    if (trackingNumber !== undefined) {
      updateFields.push(`tracking_number = $${values.length + 1}`);
      values.push(trackingNumber);
    }
    values.push(req.params.id);
    await query(
      `UPDATE orders SET ${updateFields.join(", ")} WHERE id = $${values.length}`,
      values
    );
    res.json({ ok: true, event: newEvent });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tracking." });
  }
});

app.delete("/api/orders/:id/tracking/:eventId", async (req, res) => {
  try {
    const { rows } = await query("SELECT tracking_events FROM orders WHERE id = $1 LIMIT 1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Order not found." });
    let events = [];
    try { events = JSON.parse(rows[0].tracking_events || "[]"); } catch {}
    events = events.filter(e => e.id !== req.params.eventId);
    await query("UPDATE orders SET tracking_events = $1 WHERE id = $2", [JSON.stringify(events), req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete tracking event." });
  }
});

app.patch("/api/orders/:id/tracking-number", async (req, res) => {
  try {
    await query(
      "UPDATE orders SET tracking_number = $1 WHERE id = $2",
      [req.body.trackingNumber || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tracking number." });
  }
});

app.post("/api/orders/manual", async (req, res) => {
  const {
    type, customerEmail, customerName, items,
    amountUSD, currency, notes, paymentStatus,
    cause, frequency, platform,
  } = req.body;
  if (!type || amountUSD == null) {
    return res.status(400).json({ error: "type and amountUSD are required." });
  }
  try {
    const source = platform === "telegram" ? "telegram" : "whatsapp";
    const sessionId = `${source}-${crypto.randomUUID()}`;
    const trackingNumber = type === "order" ? generateTrackingNumber() : null;
    const initialEvent = trackingNumber
      ? JSON.stringify([{
          id: crypto.randomUUID(),
          status: "processing",
          message: `Order received via ${source === "telegram" ? "Telegram" : "WhatsApp"} and is being prepared.`,
          location: "London, UK",
          timestamp: new Date().toISOString(),
        }])
      : "[]";
    const meta = JSON.stringify({
      source,
      ...(customerName ? { customerName } : {}),
      ...(notes ? { notes } : {}),
      ...(cause ? { shelter: cause } : {}),
      ...(frequency ? { frequency } : {}),
    });
    const itemsArr = Array.isArray(items) ? items : [];
    const { rows: [inserted] } = await query(
      `INSERT INTO orders (id, session_id, type, customer_email, amount_usd, currency, status, items, metadata, tracking_number, tracking_events, created_at)
       VALUES (gen_random_uuid()::TEXT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [
        sessionId, type, customerEmail || null, Math.round(amountUSD),
        currency || "usd", paymentStatus || "paid",
        JSON.stringify(itemsArr.map(i => ({
          name: i.name || "Item",
          amount: Math.round((i.priceUSD ?? 0) * 100 * (i.quantity ?? 1)),
          quantity: i.quantity ?? 1,
        }))),
        meta, trackingNumber, initialEvent,
      ]
    );
    res.json({ ok: true, order: camelizeOrder(inserted) });
  } catch (err) {
    res.status(500).json({ error: "Failed to log order." });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  const { status, customerEmail, amountUSD, currency, notes } = req.body;
  try {
    const sets = [];
    const vals = [];
    if (status)       { sets.push(`status = $${vals.length+1}`);         vals.push(status); }
    if (customerEmail){ sets.push(`customer_email = $${vals.length+1}`);  vals.push(customerEmail); }
    if (amountUSD != null){ sets.push(`amount_usd = $${vals.length+1}`); vals.push(Math.round(amountUSD)); }
    if (currency)     { sets.push(`currency = $${vals.length+1}`);        vals.push(currency); }
    if (!sets.length) return res.status(400).json({ error: "No fields to update." });
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE orders SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: "Order not found." });
    res.json(camelizeOrder(rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update order." });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM orders WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Order not found." });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order." });
  }
});

// ────────────────────────────────────────────────────────────
// 9b. Products & Euthanasia Listings (DB-backed)
// ────────────────────────────────────────────────────────────

async function ensureProductTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      breed TEXT DEFAULT '',
      age TEXT DEFAULT '',
      gender TEXT DEFAULT 'male',
      author TEXT DEFAULT '',
      location TEXT DEFAULT '',
      price_ngn REAL DEFAULT 0,
      price_usd REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'sale',
      description TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      vaccinated BOOLEAN DEFAULT FALSE,
      dewormed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS euthanasia_listings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL DEFAULT 'dog',
      breed TEXT DEFAULT '',
      age TEXT DEFAULT '',
      gender TEXT DEFAULT 'unknown',
      shelter TEXT DEFAULT '',
      location TEXT DEFAULT '',
      deadline TEXT NOT NULL DEFAULT '',
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'at-risk',
      author TEXT DEFAULT '',
      added_at TEXT NOT NULL DEFAULT ''
    );
  `);
}

async function ensureAdminTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
  `);
  
  // Seed the default admin if table is empty
  const { rowCount } = await query("SELECT id FROM admins LIMIT 1");
  if (rowCount === 0) {
    await query(`
      INSERT INTO admins (id, email, name, password, role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ["admin-1", "admin@pawglobal.com", "Super Admin", "pawglobal2024", "super", new Date().toISOString()]);
  }
}

function dbRowToProduct(row) {
  let images = [];
  try { images = JSON.parse(row.images || "[]"); } catch {}
  return {
    id: row.id, type: row.type, name: row.name,
    category: row.category || "", breed: row.breed || "",
    age: row.age || "", gender: row.gender || "male",
    author: row.author || "", location: row.location || "",
    priceNGN: row.price_ngn || 0, priceUSD: row.price_usd || 0,
    status: row.status, description: row.description || "",
    images, vaccinated: !!row.vaccinated, dewormed: !!row.dewormed,
  };
}

function dbRowToListing(row) {
  return {
    id: row.id, name: row.name, species: row.species,
    breed: row.breed || "", age: row.age || "",
    gender: row.gender || "unknown", shelter: row.shelter || "",
    location: row.location || "", deadline: row.deadline,
    image: row.image || "", description: row.description || "",
    status: row.status, author: row.author || "", addedAt: row.added_at,
  };
}

function imagesToJson(images) {
  if (Array.isArray(images)) return JSON.stringify(images);
  if (typeof images === "string") {
    return JSON.stringify(images.split("\n").map(u => u.trim()).filter(Boolean));
  }
  return "[]";
}

app.get("/api/products", async (_req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    await ensureProductTables();
    const { rows } = await query("SELECT * FROM products ORDER BY created_at ASC");
    res.json(rows.map(dbRowToProduct));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    await ensureProductTables();
    const { type, name, images, priceNGN, priceUSD, category, breed, age, gender, author, location, status, description, vaccinated, dewormed } = req.body;
    if (!type || !name) return res.status(400).json({ error: "type and name are required." });
    const prefix = type === "dog" ? "dog" : type === "cat" ? "cat" : "sup";
    const id = `${prefix}-${Date.now()}`;
    const { rows: [row] } = await query(
      `INSERT INTO products (id, type, name, category, breed, age, gender, author, location, price_ngn, price_usd, status, description, images, vaccinated, dewormed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [id, type, name, category||"", breed||"", age||"", gender||"male", author||"", location||"",
       priceNGN||0, priceUSD||0, status||"sale", description||"", imagesToJson(images), !!vaccinated, !!dewormed]
    );
    res.json(dbRowToProduct(row));
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ error: "Failed to create product." });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { images, priceNGN, priceUSD, ...rest } = req.body;
    const sets = [];
    const vals = [];
    const addField = (col, val) => { sets.push(`${col} = $${vals.length+1}`); vals.push(val); };
    if (rest.name     !== undefined) addField("name", rest.name);
    if (rest.type     !== undefined) addField("type", rest.type);
    if (rest.category !== undefined) addField("category", rest.category);
    if (rest.breed    !== undefined) addField("breed", rest.breed);
    if (rest.age      !== undefined) addField("age", rest.age);
    if (rest.gender   !== undefined) addField("gender", rest.gender);
    if (rest.author   !== undefined) addField("author", rest.author);
    if (rest.location !== undefined) addField("location", rest.location);
    if (rest.status   !== undefined) addField("status", rest.status);
    if (rest.description !== undefined) addField("description", rest.description);
    if (rest.vaccinated !== undefined) addField("vaccinated", !!rest.vaccinated);
    if (rest.dewormed !== undefined) addField("dewormed", !!rest.dewormed);
    if (priceNGN !== undefined) addField("price_ngn", priceNGN);
    if (priceUSD !== undefined) addField("price_usd", priceUSD);
    if (images   !== undefined) addField("images", imagesToJson(images));
    if (!sets.length) return res.status(400).json({ error: "Nothing to update." });
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE products SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals
    );
    if (!rows[0]) return res.status(404).json({ error: "Product not found." });
    res.json(dbRowToProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update product." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM products WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Product not found." });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product." });
  }
});

app.get("/api/euthanasia", async (_req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    await ensureProductTables();
    const { rows } = await query("SELECT * FROM euthanasia_listings ORDER BY added_at ASC");
    res.json(rows.map(dbRowToListing));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch euthanasia listings." });
  }
});

app.post("/api/euthanasia", async (req, res) => {
  try {
    await ensureProductTables();
    const { name, species, breed, age, gender, shelter, location, deadline, image, description, status, author } = req.body;
    if (!name) return res.status(400).json({ error: "name is required." });
    const id = `euth-${Date.now()}`;
    const addedAt = new Date().toISOString();
    const { rows: [row] } = await query(
      `INSERT INTO euthanasia_listings (id, name, species, breed, age, gender, shelter, location, deadline, image, description, status, author, added_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [id, name, species||"dog", breed||"", age||"", gender||"unknown", shelter||"", location||"",
       deadline||new Date(Date.now()+7*86400000).toISOString(), image||"", description||"", status||"at-risk", author||"", addedAt]
    );
    res.json(dbRowToListing(row));
  } catch (err) {
    console.error("Create listing error:", err.message);
    res.status(500).json({ error: "Failed to create listing." });
  }
});

app.put("/api/euthanasia/:id", async (req, res) => {
  try {
    const sets = [];
    const vals = [];
    const addField = (col, val) => { sets.push(`${col} = $${vals.length+1}`); vals.push(val); };
    const b = req.body;
    if (b.name        !== undefined) addField("name", b.name);
    if (b.species     !== undefined) addField("species", b.species);
    if (b.breed       !== undefined) addField("breed", b.breed);
    if (b.age         !== undefined) addField("age", b.age);
    if (b.gender      !== undefined) addField("gender", b.gender);
    if (b.shelter     !== undefined) addField("shelter", b.shelter);
    if (b.location    !== undefined) addField("location", b.location);
    if (b.deadline    !== undefined) addField("deadline", b.deadline);
    if (b.image       !== undefined) addField("image", b.image);
    if (b.description !== undefined) addField("description", b.description);
    if (b.status      !== undefined) addField("status", b.status);
    if (b.author      !== undefined) addField("author", b.author);
    if (!sets.length) return res.status(400).json({ error: "Nothing to update." });
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE euthanasia_listings SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals
    );
    if (!rows[0]) return res.status(404).json({ error: "Listing not found." });
    res.json(dbRowToListing(rows[0]));
  } catch (err) {
    res.status(500).json({ error: "Failed to update listing." });
  }
});

app.delete("/api/euthanasia/:id", async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM euthanasia_listings WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Listing not found." });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete listing." });
  }
});

// ────────────────────────────────────────────────────────────
// 9c. Admins (DB-backed)
// ────────────────────────────────────────────────────────────

app.get("/api/admins", async (_req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    await ensureAdminTable();
    const { rows } = await query("SELECT * FROM admins ORDER BY created_at ASC");
    res.json(rows.map(r => ({
      id: r.id, email: r.email, name: r.name, password: r.password, role: r.role, createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins." });
  }
});

app.post("/api/admins", async (req, res) => {
  try {
    await ensureAdminTable();
    const { email, name, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required." });
    
    // Check if exists
    const { rows: existing } = await query("SELECT id FROM admins WHERE email = $1", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already in use." });

    const id = `admin-${Date.now()}`;
    const createdAt = new Date().toISOString();
    
    const { rows: [row] } = await query(
      `INSERT INTO admins (id, email, name, password, role, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, email, name || "", password, role || "admin", createdAt]
    );
    res.json({
      id: row.id, email: row.email, name: row.name, password: row.password, role: row.role, createdAt: row.created_at
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create admin." });
  }
});

app.put("/api/admins/:id", async (req, res) => {
  try {
    const { password, name, email, role } = req.body;
    const sets = [];
    const vals = [];
    const addField = (col, val) => { sets.push(`${col} = $${vals.length+1}`); vals.push(val); };
    
    if (password !== undefined) addField("password", password);
    if (name !== undefined) addField("name", name);
    if (email !== undefined) addField("email", email);
    if (role !== undefined) addField("role", role);
    
    if (!sets.length) return res.status(400).json({ error: "Nothing to update." });
    vals.push(req.params.id);
    
    const { rows } = await query(
      `UPDATE admins SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals
    );
    if (!rows[0]) return res.status(404).json({ error: "Admin not found." });
    res.json({
      id: rows[0].id, email: rows[0].email, name: rows[0].name, password: rows[0].password, role: rows[0].role, createdAt: rows[0].created_at
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update admin." });
  }
});

app.delete("/api/admins/:id", async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM admins WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Admin not found." });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete admin." });
  }
});

// ────────────────────────────────────────────────────────────
// 10. Export for Vercel (or start locally)
// ────────────────────────────────────────────────────────────

if (require.main === module) {
  const PORT = parseInt(process.env.PORT || "3001", 10);
  pool.query("SELECT 1").then(() => {
    console.log("✅  Database connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🐾  EuthList API running locally on port ${PORT}`);
      console.log(`    Health: http://localhost:${PORT}/api/health`);
    });
  }).catch(err => {
    console.error("❌  Database connection failed:", err.message);
    process.exit(1);
  });
}

module.exports = app;

