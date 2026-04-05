/**
 * GET /api/admin/sales
 * 
 * Query params:
 *   top    — number of recent sales (default 50)
 *   group  — group by product (default false)
 */
import { requireAuth } from "../../../lib/admin-auth";
import { getRecentSales } from "../../../lib/digiseller";

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const top = parseInt(searchParams.get("top") || "50", 10);
    const group = searchParams.get("group") === "true";

    const data = await getRecentSales(top, group);

    // Normalize sales data
    const sales = (data.sales || data.rows || data.items || []).map((s) => ({
      id: s.id || s.inv || s.invoice_id,
      productId: s.id_goods || s.product_id,
      productName: s.name_goods || s.product_name || "—",
      amount: parseFloat(s.amount || s.price || 0),
      amountRub: parseFloat(s.amount_rub || s.price_rub || 0),
      currency: s.currency || "USD",
      date: s.date_pay || s.date || s.date_create || "",
      buyerEmail: s.email || s.buyer_email || "",
      uniqueCode: s.unique_code || s.code || "",
      codeState: s.code_state || s.state || "",
      isDelivered: (s.code_state || "").toLowerCase().includes("delivered") || s.delivered === true,
    }));

    // Calculate summary stats
    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
    const todaySales = sales.filter((s) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.amount, 0);

    return Response.json({
      ok: true,
      sales,
      stats: {
        totalSales: sales.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todaySales: todaySales.length,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        avgOrderValue: sales.length > 0 ? Math.round((totalRevenue / sales.length) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    console.error("Admin sales error:", error);
    return Response.json(
      { ok: false, error: error.message, sales: [], stats: {} },
      { status: 500 }
    );
  }
}
