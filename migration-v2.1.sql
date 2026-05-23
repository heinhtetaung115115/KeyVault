-- ============================================================
-- KeyVault v2.1 Migration — Run this on your EXISTING database
-- Adds: price plans, user input fields, delivery improvements
-- ============================================================

-- 1. Product price plans (e.g. Netflix 1mo, 6mo, 1yr)
CREATE TABLE IF NOT EXISTS product_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_ru TEXT,
  price NUMERIC(10,2) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_plans_product ON product_plans(product_id);

ALTER TABLE product_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plans" ON product_plans FOR SELECT USING (true);

-- 2. Product user input fields (e.g. "Enter your username")
-- Stored as JSON array on the product: [{label, label_ru, required, placeholder}]
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_inputs JSONB DEFAULT '[]';

-- 3. Add plan_id and user_inputs to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES product_plans(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_input_data JSONB DEFAULT '{}';

-- 4. Add variant_id to product_keys (keys can be linked to a specific plan)
ALTER TABLE product_keys ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES product_plans(id) ON DELETE SET NULL;

-- 5. Update claim_key to support plan-specific keys
CREATE OR REPLACE FUNCTION claim_key(p_product_id UUID, p_order_id UUID, p_plan_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_key_content TEXT;
  v_key_id UUID;
BEGIN
  IF p_plan_id IS NOT NULL THEN
    -- Try plan-specific key first
    SELECT id, key_content INTO v_key_id, v_key_content
    FROM product_keys
    WHERE product_id = p_product_id AND plan_id = p_plan_id AND is_sold = false
    ORDER BY created_at ASC LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  -- Fallback to generic key (no plan)
  IF v_key_id IS NULL THEN
    SELECT id, key_content INTO v_key_id, v_key_content
    FROM product_keys
    WHERE product_id = p_product_id AND plan_id IS NULL AND is_sold = false
    ORDER BY created_at ASC LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  IF v_key_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE product_keys
  SET is_sold = true, sold_at = now(), order_id = p_order_id
  WHERE id = v_key_id;

  RETURN v_key_content;
END;
$$ LANGUAGE plpgsql;
