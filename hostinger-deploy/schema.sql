-- ============================================================
-- PawGlobal — PostgreSQL Database Schema
-- Run this once on your database to create all required tables.
-- Compatible with PostgreSQL 13+
-- ============================================================

-- Enable UUID generation (already built-in for PostgreSQL 13+)
-- If your host requires it explicitly, uncomment:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- TABLE: store_settings
-- Stores all admin-configurable key-value settings
-- (Stripe keys, SMTP config, checkout method, WhatsApp, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed default settings (safe to re-run — uses INSERT OR IGNORE equivalent)
INSERT INTO store_settings (key, value) VALUES
  ('storeName',       'PawGlobal')
ON CONFLICT (key) DO NOTHING;

INSERT INTO store_settings (key, value) VALUES
  ('contactEmail',    'hello@pawglobal.com')
ON CONFLICT (key) DO NOTHING;

INSERT INTO store_settings (key, value) VALUES
  ('address',         '1 Global Sanctuary Plaza, London, United Kingdom')
ON CONFLICT (key) DO NOTHING;

INSERT INTO store_settings (key, value) VALUES
  ('checkoutMethod',  'stripe')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- TABLE: orders
-- Stores all purchase orders and donation records.
-- Supports Stripe payments, WhatsApp/Telegram manual orders,
-- and live shipment tracking events.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id               VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  session_id       TEXT         NOT NULL UNIQUE,
  type             TEXT         NOT NULL,                   -- 'order' | 'donation'
  customer_email   TEXT,
  amount_usd       INTEGER      NOT NULL,                   -- amount in cents (e.g. 2999 = $29.99)
  currency         TEXT         NOT NULL DEFAULT 'usd',
  status           TEXT         NOT NULL DEFAULT 'paid',    -- 'paid' | 'pending' | 'processing' | 'shipped' | 'delivered'
  items            TEXT         NOT NULL DEFAULT '[]',      -- JSON array of line items
  metadata         TEXT         NOT NULL DEFAULT '{}',      -- JSON object (source, customerName, etc.)
  tracking_number  TEXT,                                    -- e.g. PGA3XQ7VB2
  tracking_events  TEXT         NOT NULL DEFAULT '[]',      -- JSON array of tracking events
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_session_id     ON orders (session_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders (tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type           ON orders (type);

-- ============================================================
-- Schema creation complete.
-- ============================================================
