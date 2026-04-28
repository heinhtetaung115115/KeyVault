import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { verifyAdmin } from '../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  const { data, error } = await supabase.from('product_keys')
    .select('id, key_content, is_sold, sold_at, order_id, created_at')
    .eq('product_id', productId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { product_id, keys } = await request.json();
  if (!product_id || !keys || !Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ error: 'product_id and keys[] required' }, { status: 400 });
  }
  const cleaned = keys.map(k => k.trim()).filter(k => k.length > 0);
  if (cleaned.length === 0) return NextResponse.json({ error: 'No valid keys' }, { status: 400 });
  const rows = cleaned.map(key_content => ({ product_id, key_content, is_sold: false }));
  const { data, error } = await supabase.from('product_keys').insert(rows).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: data.length });
}

export async function DELETE(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabase.from('product_keys').delete().eq('id', id).eq('is_sold', false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
