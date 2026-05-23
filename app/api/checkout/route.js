import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { product_id, email, payment_method, plan_id, user_input_data } = await request.json();

    if (!product_id || !email || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get product
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate required user inputs
    const requiredInputs = (product.user_inputs || []).filter(i => i.required);
    for (const inp of requiredInputs) {
      if (!user_input_data?.[inp.label]) {
        return NextResponse.json({ error: `${inp.label} is required` }, { status: 400 });
      }
    }

    // Determine price: use plan price if plan selected, else product base price
    let finalPrice = product.price;
    let planName = null;
    if (plan_id) {
      const { data: plan } = await supabase
        .from('product_plans')
        .select('*')
        .eq('id', plan_id)
        .eq('product_id', product_id)
        .single();
      if (plan) {
        finalPrice = plan.price;
        planName = plan.name;
      }
    }

    // For auto-delivery, check stock
    if (product.delivery_type === 'auto') {
      let stockQuery = supabase
        .from('product_keys')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', product_id)
        .eq('is_sold', false);
      if (plan_id) stockQuery = stockQuery.eq('plan_id', plan_id);
      else stockQuery = stockQuery.is('plan_id', null);

      const { count } = await stockQuery;
      // Fallback: check generic keys if plan-specific not found
      if ((!count || count === 0) && plan_id) {
        const { count: genericCount } = await supabase
          .from('product_keys')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', product_id)
          .is('plan_id', null)
          .eq('is_sold', false);
        if (!genericCount || genericCount === 0) {
          return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
        }
      } else if (!count || count === 0) {
        return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
      }
    }

    // Create pending order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        product_id,
        buyer_email: email,
        amount: finalPrice,
        currency: 'USD',
        payment_method,
        delivery_type: product.delivery_type,
        status: 'pending',
        plan_id: plan_id || null,
        plan_name: planName,
        user_input_data: user_input_data || {},
      })
      .select()
      .single();

    if (orderErr) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';
    const productLabel = planName ? `${product.name} — ${planName}` : product.name;

    // === STRIPE ===
    if (payment_method === 'stripe') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: productLabel,
              ...(product.image_url && { images: [product.image_url] }),
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${baseUrl}/order/${order.id}?status=success`,
        cancel_url: `${baseUrl}?cancelled=true`,
        metadata: {
          order_id: order.id,
          product_id: product.id,
          plan_id: plan_id || '',
        },
      });

      // Save payment_id
      await supabase
        .from('orders')
        .update({ payment_id: session.id })
        .eq('id', order.id);

      return NextResponse.json({ url: session.url });
    }

    // === NOWPAYMENTS (CRYPTO) ===
    if (payment_method === 'crypto') {
      const npRes = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: finalPrice,
          price_currency: 'usd',
          order_id: order.id,
          order_description: productLabel,
          ipn_callback_url: `${baseUrl}/api/webhook/nowpayments`,
          success_url: `${baseUrl}/order/${order.id}?status=success`,
          cancel_url: `${baseUrl}?cancelled=true`,
        }),
      });

      const npData = await npRes.json();

      if (!npData.invoice_url) {
        return NextResponse.json({ error: 'Failed to create crypto invoice' }, { status: 500 });
      }

      await supabase
        .from('orders')
        .update({ payment_id: npData.id?.toString() })
        .eq('id', order.id);

      return NextResponse.json({ url: npData.invoice_url });
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
