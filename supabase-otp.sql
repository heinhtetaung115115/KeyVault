-- ============================================================
-- OTP Codes table — Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE otp_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_otp_email ON otp_codes(email, code);

-- Auto-cleanup expired OTPs (optional: run periodically)
-- DELETE FROM otp_codes WHERE expires_at < now() OR used = true;

-- RLS: no public access, service role only
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public otp access" ON otp_codes FOR SELECT USING (false);
