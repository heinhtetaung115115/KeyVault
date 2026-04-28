import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { verifyAdmin } from '../../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('products').select('*, categories(name, slug)').order('created_at', { ascending: false });
  const { data: stockData } = await supabase.from('product_keys').select('product_id, is_sold');
  const stockMap = {}; const totalMap = {};
  (stockData || []).forEach(k => {
    totalMap[k.product_id] = (totalMap[k.product_id] || 0) + 1;
    if (!k.is_sold) stockMap[k.product_id] = (stockMap[k.product_id] || 0) + 1;
  });
  const enriched = (data || []).map(p => ({ ...p, stock_count: stockMap[p.id] || 0, total_keys: totalMap[p.id] || 0 }));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(enriched);
}

export async function POST(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  if (!body.slug) body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { data, error } = await supabase.from('products').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
