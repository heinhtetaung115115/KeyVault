/**
 * POST /api/checkout
 * 
 * Body: { productIds: [123, 456] }
 * Returns payment URL(s) for the given products
 */
import { getPaymentUrl, getCartPaymentUrl } from "../../lib/digiseller";

export async function POST(request) {
  try {
    const body = await request.json();
    const { productIds, lang = "en" } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return Response.json(
        { ok: false, error: "productIds array is required" },
        { status: 400 }
      );
    }

    if (productIds.length === 1) {
      // Single product — direct payment link
      const url = getPaymentUrl(productIds[0], lang);
      return Response.json({ ok: true, paymentUrl: url, type: "single" });
    }

    // Multiple products — cart payment
    const url = getCartPaymentUrl(productIds, lang);
    // Also return individual URLs as fallback
    const individualUrls = productIds.map((id) => ({
      id,
      url: getPaymentUrl(id, lang),
    }));

    return Response.json({
      ok: true,
      paymentUrl: url,
      individualUrls,
      type: "cart",
    });
  } catch (error) {
    console.error("Checkout API error:", error);
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
