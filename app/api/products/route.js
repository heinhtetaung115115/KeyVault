import { getSupabaseAdmin } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'recommended';

  const supabase = getSupabaseAdmin();

  let query = supabase.from('products').select('*, categories(name, name_ru, slug)').eq('is_active', true);

  if (category && category !== 'all') {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single();
    if (cat) {
      query = supabase.from('products').select('*, categories(name, name_ru, slug)')
        .eq('is_active', true).eq('category_id', cat.id);
    }
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,name_ru.ilike.%${search}%`);
  }

  switch (sort) {
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'name': query = query.order('name', { ascending: true }); break;
    default: query = query.order('is_featured', { ascending: false }).order('sort_order', { ascending: true }); break;
  }

  const { data: products, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const productIds = products.map(p => p.id);
  const { data: stockData } = await supabase
    .from('product_keys').select('product_id').in('product_id', productIds).eq('is_sold', false);

  const stockMap = {};
  (stockData || []).forEach(k => { stockMap[k.product_id] = (stockMap[k.product_id] || 0) + 1; });

  const enriched = products.map(p => ({
    ...p, stock_count: stockMap[p.id] || 0,
    category_name: p.categories?.name || null,
    category_name_ru: p.categories?.name_ru || null,
    category_slug: p.categories?.slug || null,
  }));

  return NextResponse.json(enriched);
}
