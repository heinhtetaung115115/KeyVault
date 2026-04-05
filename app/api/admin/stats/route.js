/**
 * GET /api/admin/stats
 * 
 * Returns aggregated statistics: balance, sales counts, product overview
 */
import { requireAuth } from "../../../lib/admin-auth";
import { getRecentSales, getSellerProducts, getToken } from "../../../lib/digiseller";

const API_BASE = "https://api.digiseller.ru/api";
const SELLER_ID = process.env.DIGISELLER_SELLER_ID;

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    // Fetch multiple data sources in parallel
    const [salesData, productsData, balanceData] = await Promise.all([
      getRecentSales(100, false).catch(() => ({ sales: [] })),
      getSellerProducts(1, 5, "rating").catch(() => ({ rows: [], cnt: 0 })),
      fetchBalance().catch(() => null),
    ]);

    const sales = salesData.sales || salesData.rows || [];
    const totalProducts = productsData.cnt || productsData.totalCount || 0;

    // Group sales by date for chart data
    const salesByDate = {};
    sales.forEach((s) => {
      const date = (s.date_pay || s.date || "").split("T")[0] || "unknown";
      if (!salesByDate[date]) salesByDate[date] = { count: 0, revenue: 0 };
      salesByDate[date].count++;
      salesByDate[date].revenue += parseFloat(s.amount || s.price || 0);
    });

    // Group sales by product for top products
    const salesByProduct = {};
    sales.forEach((s) => {
      const name = s.name_goods || s.product_name || "Unknown";
      if (!salesByProduct[name]) salesByProduct[name] = { count: 0, revenue: 0 };
      salesByProduct[name].count++;
      salesByProduct[name].revenue += parseFloat(s.amount || s.price || 0);
    });

    const topProducts = Object.entries(salesByProduct)
      .map(([name, data]) => ({ name, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const chartData = Object.entries(salesByDate)
      .map(([date, data]) => ({ date, ...data, revenue: Math.round(data.revenue * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    return Response.json({
      ok: true,
      totalProducts,
      totalSales: sales.length,
      balance: balanceData,
      topProducts,
      chartData,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

async function fetchBalance() {
  try {
    const token = await getToken();
    const res = await fetch(
      `${API_BASE}/seller/balance?token=${token}&seller_id=${SELLER_ID}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
