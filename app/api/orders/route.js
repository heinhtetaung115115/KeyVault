import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../lib/supabase';
import { verifyToken } from '../otp/verify/route';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = searchParams.get('id');
  const token = searchParams.get('token');

  const supabase = getSupabaseAdmin();

  // Single order by ID (for order page — no OTP needed, URL is the secret)
  if (id) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, products(name, name_ru, image_url, delivery_type)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  }

  // Orders by email — requires verified OTP token
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: 'Verification required' }, { status: 401 });
  }

  // Verify the token matches the email
  const verifiedEmail = verifyToken(token);
  if (!verifiedEmail || verifiedEmail !== email.toLowerCase().trim()) {
    return NextResponse.json({ error: 'Invalid or expired verification' }, { status: 401 });
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, products(name, name_ru, image_url)')
    .eq('buyer_email', email.toLowerCase().trim())
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(orders || []);
}
