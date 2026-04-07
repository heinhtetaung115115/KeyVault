import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = searchParams.get('id');

  const supabase = getSupabaseAdmin();

  // Single order by ID (for order page)
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

  // Orders by email
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
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
