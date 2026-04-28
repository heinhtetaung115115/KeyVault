import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { getSupabaseAdmin } from '../../../lib/supabase';

function verifySignature(body, sig) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) return true;
  const sorted = Object.keys(body).sort().reduce((acc, key) => { acc[key] = body[key]; return acc; }, {});
  const hmac = createHmac('sha512', secret).update(JSON.stringify(sorted)).digest('hex');
  return hmac === sig;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sig = request.headers.get('x-nowpayments-sig');
    if (!verifySignature(body, sig)) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

    const { order_id, payment_status } = body;
    if (!order_id) return NextResponse.json({ received: true });
    if (payment_status !== 'finished' && payment_status !== 'confirmed') return NextResponse.json({ received: true });

    const supabase = getSupabaseAdmin();
    const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).single();
    if (!order || order.status !== 'pending') return NextResponse.json({ received: true });

    if (order.delivery_type === 'auto') {
      const { data: keyContent } = await supabase.rpc('claim_key', {
        p_product_id: order.product_id, p_order_id: order_id,
      });
      await supabase.from('orders').update({
        status: keyContent ? 'delivered' : 'paid',
        delivered_content: keyContent || null, updated_at: new Date().toISOString(),
      }).eq('id', order_id);
    } else {
      await supabase.from('orders').update({
        status: 'paid', updated_at: new Date().toISOString(),
      }).eq('id', order_id);
    }

    return NextResponse.json({ received: true });
  } catch(_e) {
    console.error('NOWPayments webhook error:', _e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
