import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdmin();

    // Check if there are any orders for this email first
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_email', cleanEmail)
      .limit(1);

    if (!orders || orders.length === 0) {
      // Don't reveal whether email exists — just say "sent"
      // but don't actually send (prevents enumeration)
      return NextResponse.json({ sent: true });
    }

    // Rate limit: max 1 OTP per email per 60 seconds
    const { data: recent } = await supabase
      .from('otp_codes')
      .select('created_at')
      .eq('email', cleanEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      const lastSent = new Date(recent[0].created_at);
      const secondsAgo = (Date.now() - lastSent.getTime()) / 1000;
      if (secondsAgo < 60) {
        return NextResponse.json(
          { error: 'Please wait before requesting another code', retry_after: Math.ceil(60 - secondsAgo) },
          { status: 429 }
        );
      }
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store in DB (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('otp_codes').insert({
      email: cleanEmail,
      code,
      expires_at: expiresAt,
    });

    // Send email via Resend
    await resend.emails.send({
      from: 'KeyVault <noreply@keyvaultstore.com>',
      to: cleanEmail,
      subject: 'Your KeyVault verification code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: #6366f1; color: white; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 20px; font-weight: 700;">K</div>
            <h1 style="font-size: 22px; margin: 12px 0 0; color: #0f172a;">KeyVault</h1>
          </div>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            You requested access to your orders. Use the verification code below:
          </p>
          <div style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6366f1;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
            This code expires in 10 minutes. If you did not request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            keyvaultstore.com
          </p>
        </div>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('OTP send error:', err);
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 });
  }
}
