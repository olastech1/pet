-- ============================================================
-- PawGlobal — PostgreSQL Database Schema
-- Run this ONCE on your database before first deployment.
-- Compatible with PostgreSQL 13+ (Neon, Supabase, Railway, etc.)
-- ============================================================

-- ============================================================
-- TABLE: store_settings
-- Stores all admin-configurable key-value settings
-- (Stripe keys, SMTP config, checkout method, WhatsApp, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS store_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed default settings (safe to re-run)
INSERT INTO store_settings (key, value) VALUES ('storeName',      'PawGlobal')                                    ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES ('contactEmail',   'hello@pawglobal.com')                          ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES ('address',        '1 Global Sanctuary Plaza, London, United Kingdom') ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES ('checkoutMethod', 'stripe')                                       ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES ('notifyOnOrder',  'true')                                         ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES ('notifyOnDonation', 'true')                                       ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- TABLE: orders
-- Stores all purchase orders and donation records.
-- Supports Stripe payments, WhatsApp/Telegram manual orders,
-- and live shipment tracking events.
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id       TEXT         NOT NULL UNIQUE,
  type             TEXT         NOT NULL,                    -- 'order' | 'donation'
  customer_email   TEXT,
  amount_usd       INTEGER      NOT NULL,                    -- amount in cents (e.g. 2999 = £29.99)
  currency         TEXT         NOT NULL DEFAULT 'gbp',
  status           TEXT         NOT NULL DEFAULT 'paid',     -- 'paid' | 'pending' | 'processing' | 'shipped' | 'delivered'
  items            TEXT         NOT NULL DEFAULT '[]',       -- JSON array of line items
  metadata         TEXT         NOT NULL DEFAULT '{}',       -- JSON object (source, customerName, etc.)
  tracking_number  TEXT,                                     -- e.g. PGA3XQ7VB2
  tracking_events  TEXT         NOT NULL DEFAULT '[]',       -- JSON array of tracking events
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_session_id      ON orders (session_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email  ON orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders (tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type            ON orders (type);

-- ============================================================
-- SAMPLE DATA (optional — for testing only)
-- Remove or comment out before going live
-- ============================================================

-- Sample order (Stripe payment)
INSERT INTO orders (id, session_id, type, customer_email, amount_usd, currency, status, items, metadata, tracking_number, tracking_events, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'cs_test_sample_order_001',
  'order',
  'john.doe@example.com',
  18900,
  'gbp',
  'shipped',
  '[{"name":"Golden Retriever Puppy","amount":18900,"quantity":1}]',
  '{"source":"stripe"}',
  'PGABC123XY',
  '[
    {"id":"evt-001","status":"processing","message":"Order confirmed and is being prepared.","location":"London, UK","timestamp":"2026-04-01T10:00:00Z"},
    {"id":"evt-002","status":"packed","message":"Your order has been carefully packed.","location":"London, UK","timestamp":"2026-04-02T14:30:00Z"},
    {"id":"evt-003","status":"shipped","message":"Your order is on its way!","location":"Heathrow Airport, UK","timestamp":"2026-04-03T09:15:00Z"}
  ]',
  NOW() - INTERVAL '10 days'
) ON CONFLICT (session_id) DO NOTHING;

-- Sample donation (one-time)
INSERT INTO orders (id, session_id, type, customer_email, amount_usd, currency, status, items, metadata, tracking_number, tracking_events, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'cs_test_sample_donation_001',
  'donation',
  'jane.smith@example.com',
  2500,
  'gbp',
  'paid',
  '[{"name":"PawGlobal General Rescue Fund","amount":2500,"quantity":1}]',
  '{"donor":"Jane Smith","shelter":"general","frequency":"one-time","source":"stripe"}',
  NULL,
  '[]',
  NOW() - INTERVAL '5 days'
) ON CONFLICT (session_id) DO NOTHING;

-- Sample WhatsApp order
INSERT INTO orders (id, session_id, type, customer_email, amount_usd, currency, status, items, metadata, tracking_number, tracking_events, created_at)
VALUES (
  gen_random_uuid()::TEXT,
  'whatsapp-sample-003',
  'order',
  'customer@example.com',
  8500,
  'gbp',
  'processing',
  '[{"name":"Royal Canin Premium Cat Food (10kg)","amount":8500,"quantity":2}]',
  '{"source":"whatsapp","customerName":"Alex Johnson","notes":"Please gift wrap"}',
  'PGXYZ789AB',
  '[
    {"id":"evt-wa-001","status":"processing","message":"Order received via WhatsApp and is being prepared.","location":"London, UK","timestamp":"2026-04-08T11:00:00Z"}
  ]',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (session_id) DO NOTHING;

-- ============================================================
-- Schema complete. Sample data loaded (remove before go-live).
-- ============================================================
