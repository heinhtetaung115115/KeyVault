/**
 * GET /api/orders?email=buyer@example.com
 * Returns all orders for a given buyer email
 */
import { supabase } from "../../lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").toLowerCase().trim();

    if (!email) {
      return Response.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    if (!supabase) {
      return Response.json({ ok: false, error: "Database not configured" }, { status: 500 });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders query error:", error);
      return Response.json({ ok: false, error: "Failed to fetch orders" }, { status: 500 });
    }

    return Response.json({
      ok: true,
      orders: (orders || []).map(o => ({
        id: o.id,
        invoiceId: o.invoice_id,
        uniqueCode: o.unique_code,
        productId: o.product_id,
        productName: o.product_name,
        amount: o.amount,
        currency: o.currency,
        status: o.status,
        content: o.content,
        sellerName: o.seller_name,
        paidAt: o.paid_at,
        createdAt: o.created_at,
      })),
    });
  } catch (error) {
    console.error("Orders API error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
