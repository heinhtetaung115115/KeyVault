/**
 * GET /api/products?lang=en&currency=USD&category_id=X&search=X&page=1&rows=20&order=rating
 * 
 * When no category_id ("All"):
 *   Fetches top-selling products from ALL categories and combines them
 *   into a "Recommended" list of ~30 best sellers — like Plati's homepage.
 * 
 * When category_id is specified:
 *   Fetches products from that specific category normally.
 */
import {
  getCategories,
  getProductsByCategory,
  searchProducts,
  normalizeProduct,
  normalizeCategory,
} from "../../lib/digiseller";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const rows = parseInt(searchParams.get("rows") || "20", 10);
    const order = searchParams.get("order") || "rating";
    const lang = searchParams.get("lang") || "en";
    const currency = searchParams.get("currency") || "USD";

    // ─── Search mode ───
    if (search) {
      const data = await searchProducts(search, page, rows, lang, currency);
      return respondWith(data, page, rows);
    }

    // ─── Specific category ───
    if (categoryId) {
      const data = await getProductsByCategory(parseInt(categoryId, 10), page, rows, order, lang, currency);
      return respondWith(data, page, rows);
    }

    // ─── "All" — Recommended: fetch top sellers from every category ───
    // Step 1: Get all categories
    const catData = await getCategories(lang);
    const rawCats = catData.categories || catData.category || [];
    const categories = rawCats.map(normalizeCategory);

    // Flatten categories (include subcategories)
    const allCatIds = [];
    function collectIds(cats) {
      for (const c of cats) {
        if (c.id) allCatIds.push(c.id);
        if (c.subcategories?.length) collectIds(c.subcategories);
      }
    }
    collectIds(categories);

    if (allCatIds.length === 0) {
      return Response.json({ ok: true, products: [], page: 1, rows, totalPages: 0, totalCount: 0 });
    }

    // Step 2: Fetch top products from each category in parallel
    // Distribute ~30 products across categories evenly
    const productsPerCat = Math.max(3, Math.ceil(30 / allCatIds.length));

    const categoryFetches = allCatIds.map(catId =>
      getProductsByCategory(catId, 1, productsPerCat, "rating", lang, currency)
        .then(data => {
          const rawProducts = data.product || data.products || data.rows || data.items || [];
          return (Array.isArray(rawProducts) ? rawProducts : []).map(normalizeProduct);
        })
        .catch(err => {
          console.error(`Failed to fetch category ${catId}:`, err.message);
          return [];
        })
    );

    const categoryResults = await Promise.all(categoryFetches);

    // Step 3: Combine, deduplicate by product ID, sort by sales count
    const seen = new Set();
    let allProducts = [];

    for (const products of categoryResults) {
      for (const p of products) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          allProducts.push(p);
        }
      }
    }

    // Sort by sales count (best sellers first)
    allProducts.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

    // Filter out out-of-stock products
    allProducts = allProducts.filter(p => p.inStock !== false);

    // Limit to 30 products for the "All" / recommended view
    const maxProducts = 30;
    allProducts = allProducts.slice(0, maxProducts);

    // Simple pagination for the combined list
    const startIdx = (page - 1) * rows;
    const pageProducts = allProducts.slice(startIdx, startIdx + rows);
    const totalPages = Math.ceil(allProducts.length / rows);

    return Response.json({
      ok: true,
      products: pageProducts,
      page,
      rows,
      totalPages,
      totalCount: allProducts.length,
      isRecommended: true,
    });

  } catch (error) {
    console.error("Products API error:", error);
    return Response.json(
      { ok: false, error: error.message, products: [], page: 1, totalPages: 0, totalCount: 0 },
      { status: 500 }
    );
  }
}

function respondWith(data, page, rows) {
  const rawProducts = data.product || data.products || data.rows || data.items || [];
  const allProducts = (Array.isArray(rawProducts) ? rawProducts : []).map(normalizeProduct);
  
  // Filter out out-of-stock products — only show available products
  const products = allProducts.filter(p => p.inStock !== false);
  
  const totalPages = data.pages || data.total_pages || Math.ceil((data.totalCount || data.cnt || products.length) / rows);

  return Response.json({
    ok: true, products, page, rows, totalPages,
    totalCount: products.length,
  });
}
