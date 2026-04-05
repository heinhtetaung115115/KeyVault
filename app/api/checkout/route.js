/**
 * POST /api/checkout
 * 
 * Saves order to Supabase when buyer clicks "Buy now".
 * Called before redirecting to Digiseller payment page.
 * 
 * Body: { productId, productName, price, currency, buyerEmail, 
 *          options, sellerId, sellerName, idPo }
 * 
 * The order is saved with status "pending" and updated to "paid" 
 * when the webhook fires (or buyer links their unique code).
 */
import { supabase } from "../../lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      productId, productName, price, currency,
      buyerEmail, options, sellerId, sellerName, idPo,
    } = body;

    if (!buyerEmail || !productId) {
      return Response.json({ ok: false, error: "Email and product ID are required" }, { status: 400 });
    }

    if (!supabase) {
      return Response.json({ ok: false, error: "Database not configured" }, { status: 500 });
    }

    const order = {
      invoice_id: idPo ? `po_${idPo}` : `pre_${productId}_${Date.now()}`,
      product_id: parseInt(productId, 10),
      product_name: productName || `Product #${productId}`,
      buyer_email: buyerEmail.toLowerCase().trim(),
      amount: parseFloat(price || 0),
      currency: currency || "USD",
      seller_id: String(sellerId || ""),
      seller_name: sellerName || "",
      product_options: options || null,
      status: "pending",
      paid_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from("orders")
      .insert(order)
      .select();

    if (error) {
      console.error("Checkout save error:", error);
      return Response.json({ ok: false, error: "Failed to save order" }, { status: 500 });
    }

    return Response.json({
      ok: true,
      orderId: inserted?.[0]?.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
