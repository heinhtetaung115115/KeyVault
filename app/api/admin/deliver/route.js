import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { verifyAdmin } from '../../../lib/admin-auth';

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { order_id, content } = await request.json();

  if (!order_id || !content) {
    return NextResponse.json({ error: 'order_id and content required' }, { status: 400 });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.status !== 'paid') {
    return NextResponse.json({ error: 'Order must be in paid status to deliver' }, { status: 400 });
  }

  const { error } = await supabase
    .from('orders')
    .update({
      delivered_content: content,
      status: 'delivered',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
