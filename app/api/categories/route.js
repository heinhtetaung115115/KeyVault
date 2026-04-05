/**
 * GET /api/categories?lang=en
 */
import { getCategories, normalizeCategory } from "../../lib/digiseller";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";

    const data = await getCategories(lang);
    const categories = (data.categories || data.category || []).map(normalizeCategory);
    return Response.json({ ok: true, categories });
  } catch (error) {
    console.error("Categories API error:", error);
    return Response.json({ ok: false, error: error.message, categories: [] }, { status: 500 });
  }
}
