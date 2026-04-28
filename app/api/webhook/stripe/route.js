import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch(_e) {
    console.error('Stripe webhook signature failed:', _e.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (!orderId) return NextResponse.json({ received: true });

    const supabase = getSupabaseAdmin();
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (!order || order.status !== 'pending') return NextResponse.json({ received: true });

    if (order.delivery_type === 'auto') {
      const { data: keyContent } = await supabase.rpc('claim_key', {
        p_product_id: order.product_id, p_order_id: orderId,
      });
      await supabase.from('orders').update({
        status: keyContent ? 'delivered' : 'paid',
        delivered_content: keyContent || null,
        payment_id: session.id, updated_at: new Date().toISOString(),
      }).eq('id', orderId);
    } else {
      await supabase.from('orders').update({
        status: 'paid', payment_id: session.id, updated_at: new Date().toISOString(),
      }).eq('id', orderId);
    }
  }

  return NextResponse.json({ received: true });
}
