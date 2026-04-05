/**
 * GET /api/debug?id=4149233&lang=en
 * 
 * Returns RAW responses from all Digiseller endpoints for a product.
 * DO NOT USE IN PRODUCTION — this is for debugging only.
 */
import { getToken } from "../../lib/digiseller";

const API_BASES = ["https://api.digiseller.ru/api", "https://api.digiseller.com/api"];
const SELLER_ID = process.env.DIGISELLER_SELLER_ID;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const lang = searchParams.get("lang") || "en";
  if (!id) return Response.json({ error: "Missing ?id=" });

  const productId = parseInt(id, 10);
  const digiLang = lang === "ru" ? "ru-RU" : "en-US";
  const token = await getToken();

  const results = {};

  // 1. Product detail — this is where options might be embedded
  for (const base of API_BASES) {
    try {
      const r = await fetch(`${base}/products/${productId}/data?token=${token}&seller_id=${SELLER_ID}&currency=USD&lang=${digiLang}`, {
        headers: { Accept: "application/json" },
      });
      if (r.ok) {
        const d = await r.json();
        results.productDetail = { source: base, data: d };
        // Extract just the options part for easy reading
        const raw = d.product || d;
        results.productDetail_options = raw.options || raw.params || raw.parameters || "NOT_FOUND";
        break;
      }
    } catch (e) { results.productDetail = { error: e.message }; }
  }

  // 2. Options list endpoint
  for (const base of API_BASES) {
    try {
      const r = await fetch(`${base}/products/options/list?token=${token}&product_id=${productId}&lang=${digiLang}`, {
        headers: { Accept: "application/json" },
      });
      if (r.ok) {
        const d = await r.json();
        results.optionsList = { source: base, data: d };
        break;
      }
    } catch (e) { results.optionsList = { error: e.message }; }
  }

  // 3. Product params endpoint
  for (const base of API_BASES) {
    try {
      const r = await fetch(`${base}/products/${productId}/params?token=${token}&seller_id=${SELLER_ID}&lang=${digiLang}`, {
        headers: { Accept: "application/json" },
      });
      if (r.ok) {
        const d = await r.json();
        results.productParams = { source: base, data: d };
        break;
      }
    } catch (e) { results.productParams = { error: e.message }; }
  }

  // 4. Also try the purchases/options info endpoint (read-only, shows what options exist)
  for (const base of API_BASES) {
    try {
      const r = await fetch(`${base}/products/${productId}/options?token=${token}&lang=${digiLang}`, {
        headers: { Accept: "application/json" },
      });
      if (r.ok) {
        const d = await r.json();
        results.productOptions = { source: base, data: d };
        break;
      }
    } catch (e) { results.productOptions = { error: e.message }; }
  }

  return Response.json(results, { headers: { "Content-Type": "application/json" } });
}
