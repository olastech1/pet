/**
 * PawGlobal — Standalone Production Server
 * =========================================
 * A single Express.js server that:
 *  - Serves all /api/* routes (settings, orders, checkout, tracking)
 *  - Serves the built React frontend from ./public/
 *  - Handles SPA client-side routing (404s → index.html)
 *
 * Requirements: Node.js 18+, PostgreSQL database
 * Start: node server.js  (or: PORT=3000 node server.js)
 */

"use strict";

require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const path      = require("path");
const fs        = require("fs");
const { Pool }  = require("pg");
const Stripe    = require("stripe");
const nodemailer = require("nodemailer");
const crypto    = require("crypto");

// ────────────────────────────────────────────────────────────
// 1. Configuration
// ────────────────────────────────────────────────────────────

const PORT     = parseInt(process.env.PORT || "3000", 10);
const DB_URL   = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || "production";

if (!DB_URL) {
  console.error("❌  DATABASE_URL is not set. Please check your .env file.");
  process.exit(1);
}

// ────────────────────────────────────────────────────────────
// 2. PostgreSQL Pool
// ────────────────────────────────────────────────────────────

const pool = new Pool({
  connectionString: DB_URL,
  ssl: DB_URL.includes("localhost") || DB_URL.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

// Convenience query helper
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
// 4. Stripe Helper (reads key from DB first, then env var)
// ────────────────────────────────────────────────────────────

async function getStripeClient() {
  const dbKey = await getSetting("stripeSecretKey");
  const secretKey = (dbKey && dbKey.length > 10) ? dbKey : process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe secret key is not configured.");
  return new Stripe(secretKey, { apiVersion: "2023-10-16" });
}

// ────────────────────────────────────────────────────────────
// 5. Email Helper (reads SMTP config from DB, falls back to env)
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
// 7. Express App Setup
// ────────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging (simple)
app.use((req, _res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// ────────────────────────────────────────────────────────────
// 8. API Routes
// ────────────────────────────────────────────────────────────

// --- Health ---
app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

// --- Settings: GET all ---
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
    console.error("GET /api/settings:", err.message);
    res.status(500).json({ error: "Failed to load settings." });
  }
});

// --- Settings: POST (save one or many keys) ---
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
    console.error("POST /api/settings:", err.message);
    res.status(500).json({ error: "Failed to save settings." });
  }
});

// --- Settings: Stripe status ---
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

// --- Settings: SMTP status ---
app.get("/api/settings/smtp-status", async (_req, res) => {
  try {
    const cfg = await getSmtpConfig();
    const configured = !!(cfg.host && cfg.user && cfg.pass);
    res.json({ smtp: { configured, host: cfg.host || null } });
  } catch (err) {
    res.status(500).json({ error: "Failed to check SMTP status." });
  }
});

// --- Settings: SMTP test email ---
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

// --- Settings: Checkout method (public) ---
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

// --- Checkout: Create Stripe session ---
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

// --- Checkout: Verify Stripe session (called on success page) ---
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
        console.warn("Could not save order (non-fatal):", dbErr.message);
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
          console.warn("Could not send email (non-fatal):", emailErr.message);
        }
      }
    }

    res.json(result);
  } catch (err) {
    console.error("Stripe verify error:", err.message);
    res.status(500).json({ error: "Could not verify payment status." });
  }
});

// --- Orders: Save (called internally / from Stripe webhook) ---
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
    console.error("POST /api/orders/save:", err.message);
    res.status(500).json({ error: "Failed to save order." });
  }
});

// --- Orders: List all (admin) ---
app.get("/api/orders", async (_req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 200"
    );
    res.json(rows.map(camelizeOrder));
  } catch (err) {
    console.error("GET /api/orders:", err.message);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// --- Orders: Stats (admin dashboard) ---
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
    console.error("GET /api/orders/stats:", err.message);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// --- Orders: By email (customer lookup) ---
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

// --- Orders: Track by tracking number (public) ---
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

// --- Orders: Add tracking event (admin) ---
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

    const updateFields = ["tracking_events = $1"];
    const values = [JSON.stringify(events)];
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
    console.error("PATCH /api/orders/:id/tracking:", err.message);
    res.status(500).json({ error: "Failed to update tracking." });
  }
});

// --- Orders: Delete tracking event (admin) ---
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

// --- Orders: Update tracking number (admin) ---
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

// --- Orders: Manual order (admin — WhatsApp/Telegram) ---
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
    console.error("POST /api/orders/manual:", err.message);
    res.status(500).json({ error: "Failed to log order." });
  }
});

// ────────────────────────────────────────────────────────────
// 9. Utility: snake_case → camelCase for DB rows
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
// 10. Static File Serving (built React frontend)
// ────────────────────────────────────────────────────────────

const PUBLIC_DIR = path.join(__dirname, "public");

if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, { maxAge: "7d", index: false }));
  // SPA catch-all — return index.html for any non-API route
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    const indexPath = path.join(PUBLIC_DIR, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend not built. Run the build script and place files in ./public/");
    }
  });
} else {
  console.warn("⚠️  ./public/ directory not found. Frontend will not be served.");
  console.warn("    Build the frontend and place the output in ./public/");
}

// ────────────────────────────────────────────────────────────
// 11. Start Server
// ────────────────────────────────────────────────────────────

pool.query("SELECT 1").then(() => {
  console.log("✅  Database connected");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🐾  PawGlobal server running on port ${PORT}`);
    console.log(`    Environment: ${NODE_ENV}`);
    console.log(`    API:         http://localhost:${PORT}/api/health`);
    console.log(`    Frontend:    http://localhost:${PORT}/`);
  });
}).catch(err => {
  console.error("❌  Database connection failed:", err.message);
  console.error("    Check your DATABASE_URL in .env");
  process.exit(1);
});
