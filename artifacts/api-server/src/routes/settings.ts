import { Router, type IRouter } from "express";
import { db, storeSettings } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { createSmtpTransport } from "../lib/email";

const router: IRouter = Router();

const ALLOWED_KEYS = [
  "storeName",
  "contactEmail",
  "phone",
  "address",
  "notificationEmail",
  "notifyOnOrder",
  "notifyOnAdoption",
  "notifyOnDonation",
  "stripePublishableKey",
  "stripeSecretKey",
  "paystackPublicKey",
  "paystackSecretKey",
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpPassword",
  "smtpFromName",
  "smtpFromEmail",
  "page_privacy",
  "page_terms",
  "page_shipping",
  "checkoutMethod",
  "whatsappNumber",
  "telegramUsername",
  "donationMethod",
  "paypalLink",
  "gofundmeLink",
  "donationWhatsappNumber",
  "seoMetaTitle",
  "seoMetaDescription",
  "seoKeywords",
  "seoOgTitle",
  "seoOgDescription",
  "seoOgImage",
  "seoCanonicalUrl",
  "seoTwitterCard",
  "donationStripeEnabled",
  "donationWhatsappEnabled",
  "donationPaypalEnabled",
  "donationGofundmeEnabled",
  "donationTelegramEnabled",
  "donationTelegramUsername",
  "donationCryptoEnabled",
  "donationCryptoAddress",
  "donationCryptoNetwork",
  "donationCryptoCoin",
];

const SECRET_KEYS = new Set(["stripeSecretKey", "paystackSecretKey", "smtpPassword"]);

/**
 * GET /api/settings
 * Returns all store settings as a key-value object.
 * Secret keys are redacted unless ?includeSecrets=true.
 */
router.get("/settings", async (req, res) => {
  try {
    const rows = await db.select().from(storeSettings);
    const data: Record<string, string> = {};
    const includeSecrets = req.query.includeSecrets === "true";
    for (const row of rows) {
      if (!includeSecrets && SECRET_KEYS.has(row.key)) {
        data[row.key] = row.value ? "••••••••" : "";
      } else {
        data[row.key] = row.value;
      }
    }
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Failed to load settings");
    res.status(500).json({ error: "Failed to load settings." });
  }
});

/**
 * POST /api/settings
 * Saves one or more settings. Body: { key: value, ... }
 */
router.post("/settings", async (req, res) => {
  try {
    const updates = req.body as Record<string, string>;
    const entries = Object.entries(updates).filter(([k]) => ALLOWED_KEYS.includes(k));

    for (const [key, value] of entries) {
      await db
        .insert(storeSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: storeSettings.key, set: { value, updatedAt: new Date() } });
    }

    logger.info({ keys: entries.map(([k]) => k) }, "Settings saved");
    res.json({ success: true, saved: entries.map(([k]) => k) });
  } catch (err) {
    logger.error({ err }, "Failed to save settings");
    res.status(500).json({ error: "Failed to save settings." });
  }
});

/**
 * GET /api/settings/stripe-status
 * Returns whether Stripe keys are configured (in DB or Replit connector).
 */
router.get("/settings/stripe-status", async (req, res) => {
  try {
    const rows = await db.select().from(storeSettings).where(eq(storeSettings.key, "stripeSecretKey"));
    const hasDbKey = rows.length > 0 && rows[0].value.length > 10;

    let hasReplitKey = false;
    try {
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
      const xReplitToken = process.env.REPL_IDENTITY
        ? "repl " + process.env.REPL_IDENTITY
        : null;
      if (hostname && xReplitToken) {
        const url = new URL(`https://${hostname}/api/v2/connection`);
        url.searchParams.set("include_secrets", "true");
        url.searchParams.set("connector_names", "stripe");
        url.searchParams.set("environment", "development");
        const response = await fetch(url.toString(), {
          headers: { Accept: "application/json", "X-Replit-Token": xReplitToken },
        });
        const data = await response.json();
        hasReplitKey = !!data.items?.[0]?.settings?.secret;
      }
    } catch {}

    res.json({
      stripe: { connected: hasDbKey || hasReplitKey, source: hasDbKey ? "custom" : hasReplitKey ? "replit" : "none" },
    });
  } catch (err) {
    logger.error({ err }, "Failed to check stripe status");
    res.status(500).json({ error: "Failed to check status." });
  }
});

/**
 * GET /api/settings/smtp-status
 * Returns whether SMTP is configured (DB or env vars).
 */
router.get("/settings/smtp-status", async (req, res) => {
  try {
    const rows = await db.select().from(storeSettings);
    const dbMap: Record<string, string> = {};
    for (const row of rows) dbMap[row.key] = row.value;

    const host = dbMap["smtpHost"] || process.env.SMTP_HOST || "";
    const user = dbMap["smtpUser"] || process.env.SMTP_USER || "";
    const pass = dbMap["smtpPassword"] || process.env.SMTP_PASSWORD || "";

    const configured = !!(host && user && pass);
    const source = dbMap["smtpHost"] ? "database" : process.env.SMTP_HOST ? "env" : "none";

    res.json({ configured, source, host: host || "", user: user || "" });
  } catch (err) {
    logger.error({ err }, "Failed to check SMTP status");
    res.status(500).json({ error: "Failed to check SMTP status." });
  }
});

/**
 * POST /api/settings/smtp-test
 * Sends a test email using current SMTP settings.
 */
router.post("/settings/smtp-test", async (req, res) => {
  try {
    const { to } = req.body as { to?: string };
    if (!to) return res.status(400).json({ error: "No recipient email provided." });

    const transport = await createSmtpTransport();
    if (!transport) {
      return res.status(400).json({ error: "SMTP is not configured. Please save your SMTP settings first." });
    }

    const rows = await db.select().from(storeSettings);
    const dbMap: Record<string, string> = {};
    for (const row of rows) dbMap[row.key] = row.value;
    const fromName = dbMap["smtpFromName"] || process.env.SMTP_FROM_NAME || "EuthList";
    const fromEmail = dbMap["smtpFromEmail"] || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "";

    await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "EuthList — SMTP Test Email ✓",
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#c0392b">🐾 EuthList</h2>
        <p>This is a test email confirming your SMTP settings are working correctly.</p>
        <p style="color:#888;font-size:13px">Sent from the EuthList admin panel.</p>
      </div>`,
    });

    logger.info({ to }, "SMTP test email sent");
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "SMTP test email failed");
    res.status(500).json({ error: err.message || "Failed to send test email." });
  }
});

/**
 * GET /api/settings/checkout-method
 * Public endpoint: returns the active checkout method, WhatsApp number, and Telegram username.
 */
router.get("/settings/checkout-method", async (req, res) => {
  try {
    const rows = await db.select().from(storeSettings);
    const dbMap: Record<string, string> = {};
    for (const row of rows) dbMap[row.key] = row.value;
    res.json({
      method: dbMap["checkoutMethod"] || "stripe",
      whatsappNumber: dbMap["whatsappNumber"] || "",
      telegramUsername: dbMap["telegramUsername"] || "",
    });
  } catch (err) {
    logger.error({ err }, "Failed to get checkout method");
    res.status(500).json({ error: "Failed to get checkout method." });
  }
});

/**
 * GET /api/settings/donation-method
 * Public endpoint: returns the active donation method and related config.
 */
router.get("/settings/donation-method", async (_req, res) => {
  try {
    const rows = await db.select().from(storeSettings);
    const m: Record<string, string> = {};
    for (const row of rows) m[row.key] = row.value;
    res.json({
      stripe: {
        enabled: m["donationStripeEnabled"] === "true",
      },
      whatsapp: {
        enabled: m["donationWhatsappEnabled"] === "true",
        number: m["donationWhatsappNumber"] || m["whatsappNumber"] || "",
      },
      paypal: {
        enabled: m["donationPaypalEnabled"] === "true",
        link: m["paypalLink"] || "",
      },
      gofundme: {
        enabled: m["donationGofundmeEnabled"] === "true",
        link: m["gofundmeLink"] || "",
      },
      telegram: {
        enabled: m["donationTelegramEnabled"] === "true",
        username: m["donationTelegramUsername"] || m["telegramUsername"] || "",
      },
      crypto: {
        enabled: m["donationCryptoEnabled"] === "true",
        address: m["donationCryptoAddress"] || "",
        network: m["donationCryptoNetwork"] || "Bitcoin",
        coin: m["donationCryptoCoin"] || "BTC",
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to get donation method");
    res.status(500).json({ error: "Failed to get donation method." });
  }
});

export default router;
