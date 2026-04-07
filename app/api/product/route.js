import { getSupabaseAdmin } from '../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const slug = searchParams.get('slug');

  if (!id && !slug) {
    return NextResponse.json({ error: 'id or slug required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('products')
    .select('*, categories(name, name_ru, slug)')
    .eq('is_active', true);

  if (id) query = query.eq('id', id);
  if (slug) query = query.eq('slug', slug);

  const { data: product, error } = await query.single();
  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Get stock count
  const { count } = await supabase
    .from('product_keys')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', product.id)
    .eq('is_sold', false);

  return NextResponse.json({
    ...product,
    stock_count: count || 0,
    category_name: product.categories?.name || null,
    category_name_ru: product.categories?.name_ru || null,
    category_slug: product.categories?.slug || null,
  });
}
