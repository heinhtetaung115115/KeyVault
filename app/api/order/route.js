/**
 * GET  /api/order?code=UNIQUECODE  — fetch order details + seller info
 * POST /api/order                  — send message to seller
 */
import { getToken } from "../../lib/digiseller";

const API_BASE = "https://api.digiseller.ru/api";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) return Response.json({ ok: false, error: "Missing unique code" }, { status: 400 });

    const token = await getToken();

    // Fetch order info by unique code
    const res = await fetch(`${API_BASE}/uniqueCode/${encodeURIComponent(code)}?token=${token}`, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return Response.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const data = await res.json();
    const order = data;

    // Also try to fetch chat messages for this order
    let messages = [];
    const invoiceId = order.inv || order.id_i || order.invoice_id;
    if (invoiceId) {
      try {
        const chatRes = await fetch(
          `${API_BASE}/debates/v2?token=${token}&id_i=${invoiceId}&page=1&count=50`,
          { headers: { Accept: "application/json" } }
        );
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          messages = (chatData.debates || chatData.messages || []).map(m => ({
            id: m.id,
            text: m.text || m.message || "",
            date: m.date || m.date_create || "",
            isSeller: m.is_seller === true || m.from === "seller" || m.role === "seller",
            author: m.is_seller ? (order.seller_name || "Seller") : "You",
          }));
        }
      } catch (e) {
        console.error("Chat fetch error:", e.message);
      }
    }

    // Normalize order data
    const normalized = {
      orderId: order.inv || order.id_i || order.invoice_id || "",
      uniqueCode: code,
      productId: order.id_goods || order.product_id || "",
      productName: order.name_goods || order.product_name || "",
      amount: parseFloat(order.amount || order.price || 0),
      currency: order.currency || "USD",
      date: order.date_pay || order.date_create || order.date || "",
      status: order.status || order.code_state || "paid",
      // Product options selected by buyer
      options: order.options || [],
      // Seller info
      seller: {
        id: order.id_seller || order.seller_id || "",
        name: order.seller_name || order.seller || "",
        email: order.seller_email || "",
      },
      // Content delivered
      content: order.content || order.value || "",
      contentType: order.content_type || order.type || "",
      // Chat
      messages,
      invoiceId,
    };

    return Response.json({ ok: true, order: normalized });
  } catch (error) {
    console.error("Order API error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { invoiceId, message } = body;

    if (!invoiceId || !message) {
      return Response.json({ ok: false, error: "invoiceId and message are required" }, { status: 400 });
    }

    const token = await getToken();
    const res = await fetch(`${API_BASE}/debates/v2?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        id_i: parseInt(invoiceId, 10),
        message: message,
      }),
    });

    const data = await res.json();
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("Send message error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
