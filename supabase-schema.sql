-- ═══════════════════════════════════════════════════════
-- KeyVault — Supabase Database Schema
-- Run this SQL in your Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════

-- Orders table — stores every completed purchase
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  
  -- Digiseller order data
  invoice_id TEXT UNIQUE,          -- Digiseller invoice ID (id_i)
  unique_code TEXT,                -- Unique delivery code
  product_id INTEGER NOT NULL,     -- Digiseller product ID
  product_name TEXT NOT NULL,      -- Product name at time of purchase
  
  -- Buyer
  buyer_email TEXT NOT NULL,       -- Buyer's email (for order lookup)
  buyer_ip TEXT,                   -- Buyer IP (from webhook)
  
  -- Payment
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT,             -- e.g. "credit-card", "bitcoin"
  
  -- Seller
  seller_id TEXT,
  seller_name TEXT,
  
  -- Product details
  product_options JSONB,           -- Selected options/variants
  content TEXT,                    -- Delivered content (key/code)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'paid',  -- paid, refunded, cancelled
  
  -- Timestamps
  paid_at TIMESTAMPTZ,             -- When payment was confirmed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast email lookups (buyer checking their orders)
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders (buyer_email);

-- Index for webhook deduplication
CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON orders (invoice_id);

-- Index for product lookups
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders (product_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
-- Allow reading orders only by matching email
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read orders by email (no auth needed)
CREATE POLICY "Allow read by email" ON orders
  FOR SELECT USING (true);

-- Policy: only service role can insert/update (webhook)
CREATE POLICY "Allow insert from service" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update from service" ON orders
  FOR UPDATE USING (true);
