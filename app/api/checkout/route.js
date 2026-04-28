import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { product_id, email, payment_method } = await request.json();
    if (!product_id || !email || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: product, error: prodErr } = await supabase
      .from('products').select('*').eq('id', product_id).eq('is_active', true).single();

    if (prodErr || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (product.delivery_type === 'auto') {
      const { count } = await supabase.from('product_keys')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', product_id).eq('is_sold', false);
      if (!count || count === 0) return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      product_id, buyer_email: email, amount: product.price, currency: 'USD',
      payment_method, delivery_type: product.delivery_type, status: 'pending',
    }).select().single();

    if (orderErr) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });

    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

    if (payment_method === 'stripe') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: product.name, ...(product.image_url && { images: [product.image_url] }) },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/order/${order.id}?status=success`,
        cancel_url: `${baseUrl}?cancelled=true`,
        metadata: { order_id: order.id, product_id: product.id },
      });
      await supabase.from('orders').update({ payment_id: session.id }).eq('id', order.id);
      return NextResponse.json({ url: session.url });
    }

    if (payment_method === 'crypto') {
      const npRes = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_amount: product.price, price_currency: 'usd', order_id: order.id,
          order_description: product.name,
          ipn_callback_url: `${baseUrl}/api/webhook/nowpayments`,
          success_url: `${baseUrl}/order/${order.id}?status=success`,
          cancel_url: `${baseUrl}?cancelled=true`,
        }),
      });
      const npData = await npRes.json();
      if (!npData.invoice_url) return NextResponse.json({ error: 'Failed to create crypto invoice' }, { status: 500 });
      await supabase.from('orders').update({ payment_id: npData.id?.toString() }).eq('id', order.id);
      return NextResponse.json({ url: npData.invoice_url });
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  } catch(_e) {
    console.error('Checkout error:', _e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
