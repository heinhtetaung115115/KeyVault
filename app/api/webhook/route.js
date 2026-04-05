/**
 * Webhook: GET and POST /api/webhook
 * 
 * Digiseller sends notifications here when a sale occurs.
 * 
 * GET format (parameters in URL):
 *   id_i={ID_I}&id_d={ID_D}&amount={AMOUNT}&curr={CURRENCY}&date={DATE}
 *   &email={EMAIL}&sha256={SHA256}&through={THROUGH}&ip={IP}
 *   &agent={AGENT}&cart_uid={CARTUID}&isMyProduct={ISMYPRODUCT}
 * 
 * POST format (JSON body):
 *   {"ID_I":..., "ID_D":..., "Amount":..., "Currency":..., "Email":..., ...}
 */
import { supabase } from "../../lib/supabase";
import { getToken } from "../../lib/digiseller";

const API_BASE = "https://api.digiseller.ru/api";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Check if this is a webhook call with parameters or just a health check
  const hasParams = searchParams.has("id_i") || searchParams.has("ID_I") || searchParams.has("id_d") || searchParams.has("ID_D");

  if (!hasParams) {
    return Response.json({ ok: true, message: "Webhook endpoint active" });
  }

  // Extract data from GET query parameters
  const data = {
    id_i: searchParams.get("id_i") || searchParams.get("ID_I") || "",
    id_d: searchParams.get("id_d") || searchParams.get("ID_D") || "",
    amount: searchParams.get("amount") || searchParams.get("AMOUNT") || "0",
    currency: searchParams.get("curr") || searchParams.get("CURRENCY") || "USD",
    email: searchParams.get("email") || searchParams.get("EMAIL") || "",
    date: searchParams.get("date") || searchParams.get("DATE") || "",
    ip: searchParams.get("ip") || searchParams.get("IP") || "",
    agent: searchParams.get("agent") || searchParams.get("AGENT") || "",
    isMyProduct: searchParams.get("isMyProduct") || searchParams.get("ISMYPRODUCT") || "",
    sha256: searchParams.get("sha256") || searchParams.get("SHA256") || "",
    through: searchParams.get("through") || searchParams.get("THROUGH") || "",
    cart_uid: searchParams.get("cart_uid") || searchParams.get("CARTUID") || "",
  };

  console.log("═══ DIGISELLER WEBHOOK (GET) ═══");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Data:", JSON.stringify(data, null, 2));

  await processWebhook(data);
  return Response.json({ ok: true, received: true });
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else if (contentType.includes("xml")) {
      const text = await request.text();
      data = parseXml(text);
    } else {
      try {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      } catch {
        const text = await request.text();
        // Try to parse as URL query string
        const params = new URLSearchParams(text);
        data = Object.fromEntries(params.entries());
      }
    }

    console.log("═══ DIGISELLER WEBHOOK (POST) ═══");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Data:", JSON.stringify(data, null, 2));

    await processWebhook(data);
    return Response.json({ ok: true, received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ ok: true, received: true, error: error.message });
  }
}

/**
 * Process webhook data — fetch product name, save to Supabase
 */
async function processWebhook(data) {
  try {
    // Normalize field names (Digiseller sends them in various cases)
    const invoiceId = String(data.id_i || data.ID_I || data.inv || "");
    const productId = parseInt(data.id_d || data.ID_D || data.id_goods || 0, 10);
    const buyerEmail = (data.email || data.Email || data.EMAIL || "").toLowerCase().trim();
    const amount = parseFloat(data.amount || data.Amount || data.AMOUNT || 0);
    const currency = data.currency || data.curr || data.Currency || data.CURRENCY || "USD";
    const buyerIp = data.ip || data.IP || "";
    const paidDate = data.date || data.Date || data.DATE || new Date().toISOString();

    if (!invoiceId && !productId) {
      console.warn("Webhook: no invoice or product ID, skipping");
      return;
    }

    console.log(`Processing order: invoice=${invoiceId}, product=${productId}, email=${buyerEmail}`);

    // Fetch product name from Digiseller API
    let productName = data.name_goods || data.product_name || "";
    let sellerName = "";
    let sellerId = "";
    let content = "";
    let uniqueCode = "";

    if (productId) {
      try {
        const token = await getToken();
        // Fetch product details
        const res = await fetch(
          `${API_BASE}/products/${productId}/data?token=${token}&seller_id=${process.env.DIGISELLER_SELLER_ID}&currency=${currency}&lang=en-US`,
          { headers: { Accept: "application/json" } }
        );
        if (res.ok) {
          const detail = await res.json();
          const p = detail.product || detail;
          productName = productName || p.name || `Product #${productId}`;
          sellerName = p.seller?.name || "";
          sellerId = String(p.seller?.id || "");
        }
      } catch (e) {
        console.error("Failed to fetch product details:", e.message);
        productName = productName || `Product #${productId}`;
      }
    }

    // Try to fetch order details by invoice ID (may have content/unique code)
    if (invoiceId) {
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE}/purchases/v2/${invoiceId}?token=${token}`,
          { headers: { Accept: "application/json" } }
        );
        if (res.ok) {
          const orderDetail = await res.json();
          content = orderDetail.content || orderDetail.value || "";
          uniqueCode = orderDetail.unique_code || orderDetail.uniquecode || "";
          if (!productName) productName = orderDetail.name_goods || `Product #${productId}`;
        }
      } catch (e) {
        console.error("Failed to fetch order details:", e.message);
      }
    }

    // Save to Supabase
    if (!supabase) {
      console.warn("Supabase not configured — order not saved");
      return;
    }

    if (!buyerEmail) {
      console.warn("No buyer email — order not saved");
      return;
    }

    const order = {
      invoice_id: invoiceId,
      unique_code: uniqueCode,
      product_id: productId,
      product_name: productName,
      buyer_email: buyerEmail,
      buyer_ip: buyerIp,
      amount,
      currency,
      seller_id: sellerId,
      seller_name: sellerName,
      content,
      status: "paid",
      paid_at: paidDate,
    };

    console.log("Saving order to Supabase:", JSON.stringify(order, null, 2));

    const { data: inserted, error } = await supabase
      .from("orders")
      .upsert(order, { onConflict: "invoice_id" })
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
    } else {
      console.log("✅ Order saved! ID:", inserted?.[0]?.id);
    }
  } catch (error) {
    console.error("Process webhook error:", error);
  }
}

function parseXml(xml) {
  const extract = (tag) => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
    return match ? match[1].trim() : "";
  };
  return {
    id_i: extract("id_i") || extract("ID_I"),
    id_d: extract("id_d") || extract("ID_D"),
    email: extract("email") || extract("EMAIL"),
    amount: extract("amount") || extract("AMOUNT"),
    currency: extract("curr") || extract("CURRENCY"),
    ip: extract("ip") || extract("IP"),
    date: extract("date") || extract("DATE"),
  };
}
