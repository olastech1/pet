import nodemailer from "nodemailer";
import { logger } from "./logger";
import { db, storeSettings } from "@workspace/db";

async function getSmtpConfig() {
  try {
    const rows = await db.select().from(storeSettings);
    const dbMap: Record<string, string> = {};
    for (const row of rows) dbMap[row.key] = row.value;

    return {
      host: dbMap["smtpHost"] || process.env.SMTP_HOST || "",
      port: parseInt(dbMap["smtpPort"] || process.env.SMTP_PORT || "587"),
      user: dbMap["smtpUser"] || process.env.SMTP_USER || "",
      pass: dbMap["smtpPassword"] || process.env.SMTP_PASSWORD || "",
      fromName: dbMap["smtpFromName"] || process.env.SMTP_FROM_NAME || "EuthList",
      fromEmail: dbMap["smtpFromEmail"] || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
    };
  } catch {
    return {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587"),
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASSWORD || "",
      fromName: process.env.SMTP_FROM_NAME || "EuthList",
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
    };
  }
}

export async function createSmtpTransport() {
  const cfg = await getSmtpConfig();

  if (!cfg.host || !cfg.user || !cfg.pass) {
    logger.warn("SMTP not fully configured — emails will be skipped");
    return null;
  }

  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
  });
}

async function send(options: { to: string; subject: string; html: string }) {
  const cfg = await getSmtpConfig();
  const transport = await createSmtpTransport();
  if (!transport) return;
  try {
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info({ to: options.to, subject: options.subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to: options.to }, "Failed to send email");
  }
}

/* ------------------------------------------------------------------ */
/* Email templates                                                      */
/* ------------------------------------------------------------------ */

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; background: #f5f4f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #c0392b; padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }
    .body { padding: 36px 40px; }
    .body h2 { margin: 0 0 16px; font-size: 22px; font-weight: 700; }
    .body p { margin: 0 0 14px; line-height: 1.65; color: #444; font-size: 15px; }
    .info-box { background: #faf9f7; border: 1px solid #e8e4df; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #ede9e4; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: #888; }
    .info-row .value { font-weight: 600; color: #1a1a1a; text-align: right; max-width: 60%; }
    .footer { background: #f5f4f0; padding: 20px 40px; text-align: center; font-size: 12px; color: #999; }
    .paw { font-size: 20px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🐾 EuthList</h1>
      <p>euthlist.com — Urgent Pet Rescue List</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <div class="paw">🐾</div>
      © ${new Date().getFullYear()} EuthList · euthlist.com · All rights reserved.<br />
      Saving pets from euthanasia and connecting them with loving homes worldwide.
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(opts: {
  to: string;
  customerName?: string;
  items: Array<{ name: string; quantity?: number; amount?: number }>;
  amountTotal: number;
  currency: string;
  sessionId: string;
  trackingNumber?: string;
  trackingUrl?: string;
}) {
  const name = opts.customerName || "Friend";
  const amount = (opts.amountTotal / 100).toFixed(2);
  const curr = opts.currency.toUpperCase();

  const itemRows = opts.items
    .map(
      (i) => `
      <div class="info-row">
        <span class="label">${i.name}${i.quantity && i.quantity > 1 ? ` × ${i.quantity}` : ""}</span>
        <span class="value">${curr} ${i.amount ? (i.amount / 100).toFixed(2) : "—"}</span>
      </div>`
    )
    .join("");

  const trackingBlock = opts.trackingNumber
    ? `
    <div style="background: #fff8f0; border: 1px solid #f5c89a; border-radius: 12px; padding: 20px 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">Your Tracking Number</p>
      <p style="margin: 0 0 14px; font-size: 26px; font-weight: 800; letter-spacing: 0.12em; color: #c0392b; font-family: monospace;">${opts.trackingNumber}</p>
      ${opts.trackingUrl ? `<a href="${opts.trackingUrl}" style="display: inline-block; background: #c0392b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 8px;">Track My Order →</a>` : ""}
      <p style="margin: 14px 0 0; font-size: 12px; color: #aaa;">You can also look up your order anytime at <a href="https://euthlist.com/my-orders" style="color: #c0392b;">euthlist.com/my-orders</a></p>
    </div>`
    : "";

  const html = baseTemplate(`
    <h2>Order confirmed! 🎉</h2>
    <p>Hi ${name}, thank you for your purchase. We're thrilled to help you find your perfect companion.</p>

    <div class="info-box">
      ${itemRows}
      <div class="info-row" style="margin-top:8px; padding-top: 10px; border-top: 2px solid #ddd;">
        <span class="label" style="font-weight:700;">Total</span>
        <span class="value">${curr} ${amount}</span>
      </div>
    </div>

    ${trackingBlock}

    <p>Our team will be in touch shortly with next steps for your pet's journey to their new home. If you have any questions, just reply to this email or contact us at <a href="mailto:hello@euthlist.com" style="color:#c0392b;">hello@euthlist.com</a>.</p>
    <p>With love,<br/><strong>The EuthList Team</strong></p>
  `);

  await send({
    to: opts.to,
    subject: `Your EuthList order is confirmed 🐾${opts.trackingNumber ? ` · Tracking: ${opts.trackingNumber}` : ""}`,
    html,
  });
}

export async function sendDonationReceipt(opts: {
  to: string;
  donorName: string;
  amountTotal: number;
  currency: string;
  causeLabel: string;
  message?: string;
  sessionId: string;
  frequency?: "once" | "monthly";
}) {
  const amount = (opts.amountTotal / 100).toFixed(2);
  const curr = opts.currency.toUpperCase();
  const isMonthly = opts.frequency === "monthly";

  const recurringBadge = isMonthly
    ? `<div style="background: #fff8f0; border: 1px solid #f5c89a; border-radius: 10px; padding: 14px 18px; margin: 18px 0; text-align: center;">
        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #c0392b;">🔄 Monthly Recurring Donation Active</p>
        <p style="margin: 0; font-size: 12px; color: #888;">Your card will be charged <strong>${curr} ${amount}</strong> every month. To cancel, email us at <a href="mailto:hello@euthlist.com" style="color:#c0392b;">hello@euthlist.com</a>.</p>
       </div>`
    : "";

  const html = baseTemplate(`
    <h2>${isMonthly ? "Monthly donation confirmed! 🔄❤️" : "Thank you for your donation! ❤️"}</h2>
    <p>Dear ${opts.donorName}, your generosity makes a real difference for animals around the world.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="label">Donated to</span>
        <span class="value">${opts.causeLabel}</span>
      </div>
      <div class="info-row">
        <span class="label">Amount</span>
        <span class="value">${curr} ${amount}${isMonthly ? " / month" : ""}</span>
      </div>
      <div class="info-row">
        <span class="label">Frequency</span>
        <span class="value">${isMonthly ? "Monthly recurring" : "One-time"}</span>
      </div>
      ${
        opts.message
          ? `<div class="info-row">
        <span class="label">Your message</span>
        <span class="value" style="font-style:italic;">"${opts.message}"</span>
      </div>`
          : ""
      }
    </div>

    ${recurringBadge}

    <p>100% of your donation goes directly to our partner rescue centres and shelters — no admin fees, no overhead cuts.</p>
    <p>${isMonthly ? "As a monthly donor, you're one of our most valued supporters. Your consistent giving lets our partner shelters plan ahead, keep vets on staff, and rescue more animals every month." : "You're helping us rescue, treat, and rehome animals across the globe. Thank you for being part of the EuthList family."}</p>
    <p>With gratitude,<br/><strong>The EuthList Team</strong></p>
  `);

  await send({
    to: opts.to,
    subject: isMonthly
      ? `Monthly donation confirmed — ${curr} ${amount}/month 🔄🐾`
      : `Your EuthList donation receipt — ${curr} ${amount} 🐾`,
    html,
  });
}
