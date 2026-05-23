import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { createHmac } from 'crypto';

// Create a simple signed token (email + timestamp + signature)
function createToken(email) {
  const secret = process.env.ADMIN_PASSWORD || 'fallback-secret';
  const payload = `${email}:${Date.now() + 30 * 60 * 1000}`; // 30 min expiry
  const sig = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
  // Base64 encode for URL safety
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyToken(token) {
  try {
    const secret = process.env.ADMIN_PASSWORD || 'fallback-secret';
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;

    const [email, expiry, sig] = parts;
    const payload = `${email}:${expiry}`;
    const expected = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);

    if (sig !== expected) return null;
    if (Date.now() > parseInt(expiry)) return null;

    return email;
  } catch (_e) {
    return null;
  }
}

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdmin();

    // Find matching unused, non-expired OTP
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('email', cleanEmail)
      .eq('code', code.trim())
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Create a signed token
    const token = createToken(cleanEmail);

    return NextResponse.json({ verified: true, token });
  } catch (err) {
    console.error('OTP verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
