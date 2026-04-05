/**
 * GET   /api/admin/products           — List all products with details
 * PATCH /api/admin/products           — Update product (toggle on/off, change price)
 */
import { requireAuth } from "../../../lib/admin-auth";
import { getSellerProducts, getToken, normalizeProduct } from "../../../lib/digiseller";

const API_BASE = "https://api.digiseller.ru/api";

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const rows = parseInt(searchParams.get("rows") || "50", 10);

    const data = await getSellerProducts(page, rows, "name");

    const rawProducts = data.product || data.products || data.rows || [];
    const products = (Array.isArray(rawProducts) ? rawProducts : []).map((p) => {
      const normalized = normalizeProduct(p);
      return {
        ...normalized,
        // Extra admin fields
        contentCount: p.cnt_content || p.in_stock_count || 0,
        isEnabled: p.enabled !== false && p.active !== false,
        dateCreate: p.date_create || p.date_add || "",
        dateUpdate: p.date_update || p.date_edit || "",
        agentCommission: p.comission_partner || p.agent_commission || 0,
      };
    });

    return Response.json({
      ok: true,
      products,
      page,
      totalCount: data.totalCount || data.cnt || products.length,
      totalPages: data.pages || Math.ceil((data.cnt || products.length) / rows),
    });
  } catch (error) {
    console.error("Admin products error:", error);
    return Response.json(
      { ok: false, error: error.message, products: [] },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { productId, action, value } = body;

    if (!productId || !action) {
      return Response.json(
        { ok: false, error: "productId and action are required" },
        { status: 400 }
      );
    }

    const token = await getToken();

    if (action === "toggle") {
      // Enable or disable a product
      const res = await fetch(`${API_BASE}/product/edit/base?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_goods: parseInt(productId, 10),
          enabled: value === true || value === "true",
        }),
      });
      const data = await res.json();
      return Response.json({ ok: true, data });
    }

    if (action === "updatePrice") {
      // Update product price
      const res = await fetch(`${API_BASE}/product/edit/base?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_goods: parseInt(productId, 10),
          price: parseFloat(value),
        }),
      });
      const data = await res.json();
      return Response.json({ ok: true, data });
    }

    return Response.json(
      { ok: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin product update error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
