/**
 * GET  /api/admin/messages          — List all conversations
 * GET  /api/admin/messages?id=X     — Get messages in a conversation
 * POST /api/admin/messages          — Send a reply
 */
import { requireAuth } from "../../../lib/admin-auth";
import { getToken } from "../../../lib/digiseller";

const API_BASE = "https://api.digiseller.ru/api";

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("id");
    const token = await getToken();

    if (chatId) {
      // Get messages in a specific conversation
      const res = await fetch(
        `${API_BASE}/debates/v2?token=${token}&id_i=${chatId}&page=1&count=50`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();

      const messages = (data.debates || data.messages || []).map((m) => ({
        id: m.id || m.id_debate,
        text: m.text || m.message || "",
        date: m.date || m.date_create || "",
        isAdmin: m.is_seller === true || m.from === "seller" || m.role === "seller",
        author: m.is_seller ? "You" : (m.name || m.buyer || "Buyer"),
        hasAttachment: !!m.attachment || !!m.file,
      }));

      return Response.json({ ok: true, messages, chatId });
    }

    // List all conversations (dialogs)
    const res = await fetch(
      `${API_BASE}/debates/v2/chats?token=${token}&page=1&count=50&filter=all`,
      { headers: { Accept: "application/json" } }
    );
    const data = await res.json();

    const chats = (data.chats || data.dialogs || data.rows || []).map((c) => ({
      id: c.id_i || c.id || c.invoice_id,
      productName: c.name_goods || c.product_name || "—",
      productId: c.id_goods || c.product_id,
      buyerName: c.name || c.buyer || c.email || "Buyer",
      lastMessage: c.last_message || c.text || "",
      date: c.date || c.date_last || "",
      unread: c.unread || c.cnt_unread || 0,
      status: c.state || c.status || "open",
      amount: parseFloat(c.amount || c.price || 0),
    }));

    // Sort by date, newest first
    chats.sort((a, b) => new Date(b.date) - new Date(a.date));

    return Response.json({
      ok: true,
      chats,
      totalUnread: chats.reduce((sum, c) => sum + c.unread, 0),
    });
  } catch (error) {
    console.error("Admin messages error:", error);
    return Response.json(
      { ok: false, error: error.message, chats: [], messages: [] },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { chatId, message } = await request.json();

    if (!chatId || !message) {
      return Response.json(
        { ok: false, error: "chatId and message are required" },
        { status: 400 }
      );
    }

    const token = await getToken();
    const res = await fetch(`${API_BASE}/debates/v2?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        id_i: parseInt(chatId, 10),
        message: message,
      }),
    });

    const data = await res.json();

    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("Admin send message error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
