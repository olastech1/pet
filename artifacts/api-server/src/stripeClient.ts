import Stripe from "stripe";
import { db, storeSettings } from "@workspace/db";
import { eq } from "drizzle-orm";

async function getDbKey(key: string): Promise<string | null> {
  try {
    const rows = await db.select().from(storeSettings).where(eq(storeSettings.key, key));
    return rows.length > 0 && rows[0].value.length > 10 ? rows[0].value : null;
  } catch {
    return null;
  }
}

async function fetchConnectorConnection(
  hostname: string,
  token: string,
  environment: string
): Promise<{ publishableKey: string; secretKey: string } | null> {
  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", environment);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": token,
    },
  });

  const data = await response.json();
  const conn = data.items?.[0];

  if (!conn?.settings?.publishable || !conn?.settings?.secret) {
    return null;
  }

  return {
    publishableKey: conn.settings.publishable,
    secretKey: conn.settings.secret,
  };
}

async function getReplitCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Stripe Replit connector not available");
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";

  // Try production first when deployed, then fall back to development
  if (isProduction) {
    const prodConn = await fetchConnectorConnection(hostname, xReplitToken, "production");
    if (prodConn) return prodConn;
  }

  // Fall back to development connection (always available in dev; fallback in prod)
  const devConn = await fetchConnectorConnection(hostname, xReplitToken, "development");
  if (devConn) return devConn;

  throw new Error("Stripe connection not found (neither production nor development)");
}

// WARNING: Never cache this client.
// Always call this function again to get a fresh client.
// Checks DB for custom key first, then falls back to Replit connector.
export async function getUncachableStripeClient(): Promise<Stripe> {
  const dbSecret = await getDbKey("stripeSecretKey");

  let secretKey: string;
  if (dbSecret) {
    secretKey = dbSecret;
  } else {
    const creds = await getReplitCredentials();
    secretKey = creds.secretKey;
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil" as any,
  });
}

export async function getStripePublishableKey(): Promise<string> {
  const dbKey = await getDbKey("stripePublishableKey");
  if (dbKey) return dbKey;
  const creds = await getReplitCredentials();
  return creds.publishableKey;
}

export async function getStripeSecretKey(): Promise<string> {
  const dbSecret = await getDbKey("stripeSecretKey");
  if (dbSecret) return dbSecret;
  const creds = await getReplitCredentials();
  return creds.secretKey;
}
