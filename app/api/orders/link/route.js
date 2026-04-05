/**
 * POST /api/orders/link
 * 
 * Buyer pastes their unique code (from Digiseller receipt).
 * We fetch full order details from Digiseller and update the order in Supabase.
 * 
 * Body: { email, uniqueCode }
 */
import { supabase } from "../../../lib/supabase";
import { getToken } from "../../../lib/digiseller";

const API_BASE = "https://api.digiseller.ru/api";

export async function POST(request) {
  try {
    const { email, uniqueCode } = await request.json();

    if (!email || !uniqueCode) {
      return Response.json({ ok: false, error: "Email and unique code are required" }, { status: 400 });
    }

    if (!supabase) {
      return Response.json({ ok: false, error: "Database not configured" }, { status: 500 });
    }

    // Fetch order details from Digiseller using the unique code
    const token = await getToken();
    const res = await fetch(`${API_BASE}/uniqueCode/${encodeURIComponent(uniqueCode)}?token=${token}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return Response.json({ ok: false, error: "Invalid unique code or order not found" }, { status: 404 });
    }

    const data = await res.json();
    const invoiceId = String(data.inv || data.id_i || "");
    const productId = parseInt(data.id_goods || data.product_id || 0, 10);
    const content = data.content || data.value || "";
    const productName = data.name_goods || data.product_name || "";
    const amount = parseFloat(data.amount || data.price || 0);
    const currency = data.currency || "USD";
    const sellerName = data.seller_name || data.seller || "";
    const sellerId = String(data.id_seller || "");

    // Try to find existing pending order for this email and product
    const { data: existing } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_email", email.toLowerCase().trim())
      .eq("product_id", productId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      // Update existing order
      const { error } = await supabase
        .from("orders")
        .update({
          invoice_id: invoiceId,
          unique_code: uniqueCode,
          content,
          status: "paid",
          amount: amount || existing[0].amount,
          seller_name: sellerName || existing[0].seller_name,
          seller_id: sellerId || existing[0].seller_id,
          product_name: productName || existing[0].product_name,
        })
        .eq("id", existing[0].id);

      if (error) {
        console.error("Update order error:", error);
        return Response.json({ ok: false, error: "Failed to update order" }, { status: 500 });
      }

      return Response.json({ ok: true, message: "Order linked successfully", orderId: existing[0].id });
    } else {
      // No pending order found — create a new one
      const { data: inserted, error } = await supabase
        .from("orders")
        .insert({
          invoice_id: invoiceId,
          unique_code: uniqueCode,
          product_id: productId,
          product_name: productName || `Product #${productId}`,
          buyer_email: email.toLowerCase().trim(),
          amount,
          currency,
          seller_id: sellerId,
          seller_name: sellerName,
          content,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error("Insert order error:", error);
        return Response.json({ ok: false, error: "Failed to save order" }, { status: 500 });
      }

      return Response.json({ ok: true, message: "Order created from unique code", orderId: inserted?.[0]?.id });
    }
  } catch (error) {
    console.error("Link order error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
