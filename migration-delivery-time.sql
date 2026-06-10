-- Add custom delivery time text per product
-- Run this in Supabase SQL Editor
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_time TEXT;
-- Example values: "15-60 minutes", "1-2 hours", "Within 6 hours", "24 hours"
