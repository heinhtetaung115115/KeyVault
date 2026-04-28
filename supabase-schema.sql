-- ============================================================
-- KeyVault v2 — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Categories
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ru TEXT,
  slug TEXT UNIQUE NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ru TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_ru TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'auto' CHECK (delivery_type IN ('auto', 'manual')),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Product keys / codes
CREATE TABLE product_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  key_content TEXT NOT NULL,
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMPTZ,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Orders
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  buyer_email TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'crypto')),
  payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'cancelled', 'refunded')),
  delivered_content TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_product_keys_product ON product_keys(product_id);
CREATE INDEX idx_product_keys_unsold ON product_keys(product_id, is_sold) WHERE is_sold = false;
CREATE INDEX idx_orders_email ON orders(buyer_email);
CREATE INDEX idx_orders_payment ON orders(payment_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 6. Atomic key claiming function (race-safe)
CREATE OR REPLACE FUNCTION claim_key(p_product_id UUID, p_order_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_key_content TEXT;
  v_key_id UUID;
BEGIN
  SELECT id, key_content INTO v_key_id, v_key_content
  FROM product_keys
  WHERE product_id = p_product_id AND is_sold = false
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_key_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE product_keys
  SET is_sold = true, sold_at = now(), order_id = p_order_id
  WHERE id = v_key_id;

  RETURN v_key_content;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "No public key access" ON product_keys FOR SELECT USING (false);
CREATE POLICY "No public order access" ON orders FOR SELECT USING (false);

-- 8. OTP codes for order lookup verification
CREATE TABLE otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_lookup ON otp_codes(email, code, used);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public otp access" ON otp_codes FOR SELECT USING (false);

-- 9. Seed categories
INSERT INTO categories (name, name_ru, slug, sort_order) VALUES
  ('Steam Games', 'Игры Steam', 'steam-games', 1),
  ('Xbox Games', 'Игры Xbox', 'xbox-games', 2),
  ('PlayStation', 'PlayStation', 'playstation', 3),
  ('Gift Cards', 'Подарочные карты', 'gift-cards', 4),
  ('Software', 'Программы', 'software', 5),
  ('Subscriptions', 'Подписки', 'subscriptions', 6);
