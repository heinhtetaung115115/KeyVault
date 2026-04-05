/**
 * GET  /api/product?id=X&lang=en&currency=USD
 * POST /api/product  — submit options, get id_po
 */
import {
  getProductDetails,
  getProductReviews,
  normalizeProduct,
  getPaymentUrl,
  getToken,
} from "../../lib/digiseller";
import { headers } from "next/headers";

const API_BASES = ["https://api.digiseller.ru/api", "https://api.digiseller.com/api"];
const SELLER_ID = process.env.DIGISELLER_SELLER_ID;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const lang = searchParams.get("lang") || "en";
    const currency = searchParams.get("currency") || "USD";
    if (!id) return Response.json({ ok: false, error: "Missing product id" }, { status: 400 });
    const productId = parseInt(id, 10);

    const [details, reviewsData] = await Promise.all([
      getProductDetails(productId, lang, currency),
      getProductReviews(productId, 1, 10).catch(() => ({ reviews: [] })),
    ]);

    const raw = details.product || details;
    const product = normalizeProduct(raw);
    product.fullDescription = raw.info || product.description;
    product.additionalInfo = raw.add_info || "";
    product.reviews = (reviewsData.reviews || []).map(r => ({
      id: r.id, text: r.text || r.info || "",
      rating: r.rating || r.mark || 0,
      date: r.date || r.date_create || "",
      author: r.name || r.buyer || (lang === "ru" ? "Покупатель" : "Buyer"),
    }));

    // Parse options using the CORRECT field mapping from Digiseller
    const rawOptions = raw.options || [];
    product.options = rawOptions.map(opt => ({
      // ID of the parameter
      id: opt.id,
      // Display label — use "label" field, NOT "name" (name contains raw ID like option_radio_XXX)
      name: opt.label || opt.comment || opt.name || "",
      comment: opt.comment || "",
      type: (opt.type || "text").toLowerCase(),
      required: opt.required === 1 || opt.required === true,
      // Variants — for radio/select options
      variants: (opt.variants || []).map(v => ({
        // Variant ID is in "value" field, NOT "id"
        id: v.value,
        // Display text is in "text" field, NOT "name"
        name: v.text || "",
        // Price modifier is in "modify_value", NOT "rate"
        rate: parseFloat(v.modify_value || 0),
        // The formatted modifier string (e.g. "+5,50 USD")
        modifyDisplay: v.modify || "",
        isDefault: v.default === 1 || v.default === true,
      })),
    }));

    product.paymentUrl = getPaymentUrl(productId, lang);

    // Override stock with detailed info from full product response
    // The raw response has: is_available (1/0), num_in_stock, show_rest
    product.inStock = raw.is_available === 1;
    product.numInStock = parseInt(raw.num_in_stock || 0, 10);
    product.showRest = raw.show_rest === 1;

    // Statistics from the product response
    if (raw.statistics) {
      product.salesCount = raw.statistics.sales || product.salesCount;
      product.refunds = raw.statistics.refunds || 0;
      product.goodReviews = raw.statistics.good_reviews || 0;
      product.badReviews = raw.statistics.bad_reviews || 0;
    }

    return Response.json({ ok: true, product });
  } catch (error) {
    console.error("Product detail API error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, options, lang = "en", unitCnt } = body;
    if (!productId) return Response.json({ ok: false, error: "Missing productId" }, { status: 400 });

    const headersList = await headers();
    const buyerIp =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      headersList.get("cf-connecting-ip") ||
      "127.0.0.1";

    const token = await getToken();
    const digiLang = lang === "ru" ? "ru-RU" : "en-US";

    // Format options for Digiseller's purchases/options endpoint
    // For radio/select: { id: paramId, value: { id: variantValue } }
    // For text:         { id: paramId, value: { text: "user input" } }
    const formattedOptions = (options || []).map(opt => {
      const o = { id: parseInt(opt.id, 10) };
      const tp = (opt.type || "").toLowerCase();
      if (tp === "text" || tp === "textarea" || tp === "input") {
        o.value = { text: String(opt.value || "") };
      } else {
        // radio/select/checkbox — value is the variant's "value" field (e.g. 17296626)
        o.value = { id: parseInt(opt.value, 10) };
      }
      return o;
    });

    const reqBody = {
      product_id: parseInt(productId, 10),
      options: formattedOptions,
      lang: digiLang,
      ip: buyerIp,
    };
    if (unitCnt && unitCnt > 1) reqBody.unit_cnt = unitCnt;

    console.log("═══ SUBMIT OPTIONS ═══");
    console.log("IP:", buyerIp);
    console.log("Request:", JSON.stringify(reqBody, null, 2));

    // Try both API domains
    let lastData = null;
    for (const base of API_BASES) {
      try {
        const res = await fetch(`${base}/purchases/options?token=${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(reqBody),
        });
        const data = await res.json();
        console.log(`Response from ${base}:`, JSON.stringify(data, null, 2));

        if (data.retval === 0 && data.id_po) {
          return Response.json({
            ok: true,
            id_po: data.id_po,
            sellerId: SELLER_ID,
            affiliateId: process.env.DIGISELLER_AFFILIATE_ID || SELLER_ID,
          });
        }
        lastData = data;
      } catch (e) {
        console.error(`${base} error:`, e.message);
        lastData = { retdesc: e.message };
      }
    }

    return Response.json({
      ok: false,
      error: lastData?.retdesc || "Failed to submit options",
      details: lastData,
      submitted: reqBody,
    });
  } catch (error) {
    console.error("Submit options error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
