"use client";

import { useState } from "react";
import { StoreProvider, useStore } from "../components/StoreContext";
import Header from "../components/Header";
import { Footer } from "../components/Extras";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";

function OrdersPage() {
  const { v, dark, t, cur, lang } = useStore();

  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [copied, setCopied] = useState(null);

  // Chat state
  const [chatMsg, setChatMsg] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const lookupOrders = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setOrders(null);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders || []);
        if (data.orders?.length === 0) setError(lang === "ru" ? "Заказы не найдены" : "No orders found for this email");
      } else {
        setError(data.error || "Failed to fetch orders");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendMessage = async (invoiceId) => {
    if (!chatMsg.trim() || !invoiceId || chatSending) return;
    setChatSending(true);
    try {
      await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, message: chatMsg }),
      });
      setChatMsg("");
      alert(lang === "ru" ? "Сообщение отправлено!" : "Message sent!");
    } catch (e) {
      alert("Failed to send message");
    } finally {
      setChatSending(false);
    }
  };

  const T = {
    title: lang === "ru" ? "Мои заказы" : "My Orders",
    subtitle: lang === "ru" ? "Введите email, указанный при покупке" : "Enter the email you used during purchase",
    placeholder: lang === "ru" ? "Ваш email" : "Your email address",
    lookup: lang === "ru" ? "Найти заказы" : "Find Orders",
    order: lang === "ru" ? "Заказ" : "Order",
    paid: lang === "ru" ? "Оплачен" : "Paid",
    product: lang === "ru" ? "Товар" : "Product",
    code: lang === "ru" ? "Код" : "Code",
    content: lang === "ru" ? "Содержимое" : "Content",
    chatSeller: lang === "ru" ? "Написать продавцу" : "Chat with Seller",
    review: lang === "ru" ? "Оставить отзыв" : "Leave Review",
    noOrders: lang === "ru" ? "Заказов не найдено" : "No orders found",
    copy: lang === "ru" ? "Копировать" : "Copy",
    viewProduct: lang === "ru" ? "Посмотреть товар" : "View Product",
  };

  return (
    <div style={{ minHeight: "100vh", background: v.bg, color: v.tx, transition: "background .35s" }}>
      <Header onSearch={() => {}} storeName={STORE_NAME} />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px 48px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{T.title}</h1>
        <p style={{ fontSize: 14, color: v.tx2, marginBottom: 24 }}>{T.subtitle}</p>

        {/* Email lookup form */}
        <form onSubmit={lookupOrders} style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder={T.placeholder}
            style={{ flex: 1, height: 46, padding: "0 16px", border: `1px solid ${v.border}`, borderRadius: 10, background: v.surface, color: v.tx, fontSize: 14, outline: "none" }}
            onFocus={e => e.target.style.borderColor = v.accent}
            onBlur={e => e.target.style.borderColor = v.border}
          />
          <button type="submit" disabled={loading} style={{ height: 46, padding: "0 24px", borderRadius: 10, border: "none", background: loading ? v.surface3 : "linear-gradient(135deg,#3b82f6,#2563eb)", color: loading ? v.tx3 : "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap" }}>
            {loading ? "..." : T.lookup}
          </button>
        </form>

        {error && <div style={{ padding: "14px 18px", background: dark ? "#1a1520" : "#fef2f2", border: `1px solid ${v.red}25`, borderRadius: 10, marginBottom: 20, fontSize: 13, color: v.red }}>{error}</div>}

        {/* Orders list */}
        {orders && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map(order => {
              const isExpanded = expandedId === order.id;
              return (
                <div key={order.id} style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: 12, overflow: "hidden" }}>
                  {/* Order header — always visible */}
                  <button onClick={() => setExpandedId(isExpanded ? null : order.id)} style={{ width: "100%", padding: "16px 20px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                    {/* Status icon */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: order.status === "paid" ? (dark ? "#0d2818" : "#dcfce7") : (dark ? "#1a1520" : "#fef2f2"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {order.status === "paid" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={v.red} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: v.tx, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.productName}</div>
                      <div style={{ fontSize: 12, color: v.tx3 }}>
                        {order.paidAt ? new Date(order.paidAt).toLocaleDateString() : ""} • {order.amount} {order.currency}
                        {order.sellerName ? ` • ${order.sellerName}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: order.status === "paid" ? v.green : v.red, background: order.status === "paid" ? (dark ? "#0d2818" : "#dcfce7") : (dark ? "#1a1520" : "#fef2f2"), padding: "3px 10px", borderRadius: 6 }}>{T.paid}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={v.tx3} strokeWidth="2" strokeLinecap="round" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${v.border}` }}>
                      {/* Delivered content */}
                      {order.content && (
                        <div style={{ margin: "16px 0", padding: "14px 16px", background: dark ? "#0c1e3d" : "#dbeafe", border: `1px solid ${v.accent}25`, borderRadius: 10 }}>
                          <div style={{ fontSize: 11, color: v.accent, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>{T.content}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <code style={{ flex: 1, fontSize: 14, fontWeight: 600, color: v.tx, wordBreak: "break-all", userSelect: "all" }}>{order.content}</code>
                            <button onClick={() => copyText(order.content, `content-${order.id}`)} style={{ height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid ${v.accent}40`, background: "transparent", color: v.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                              {copied === `content-${order.id}` ? "✓" : T.copy}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Unique code */}
                      {order.uniqueCode && (
                        <div style={{ margin: "12px 0", padding: "12px 16px", background: dark ? "#261a04" : "#fff7ed", border: `1px solid #f59e0b30`, borderRadius: 10 }}>
                          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>{T.code}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <code style={{ flex: 1, fontSize: 13, fontWeight: 600, color: v.tx, fontFamily: "monospace" }}>{order.uniqueCode}</code>
                            <button onClick={() => copyText(order.uniqueCode, `code-${order.id}`)} style={{ height: 30, padding: "0 12px", borderRadius: 6, border: `1px solid #f59e0b40`, background: "transparent", color: "#f59e0b", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              {copied === `code-${order.id}` ? "✓" : T.copy}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Order details */}
                      <div style={{ margin: "12px 0", fontSize: 13, color: v.tx2 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${v.border}` }}>
                          <span>{T.order}:</span><span style={{ fontWeight: 600, color: v.tx }}>{order.invoiceId}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                        <a href={`/product/${order.productId}`} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: `1px solid ${v.border}`, background: "transparent", color: v.tx2, textDecoration: "none", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {T.viewProduct}
                        </a>
                        <a href={`https://digiseller.market/resultpage?order_id=${order.invoiceId}`} target="_blank" rel="noopener noreferrer" style={{ height: 36, padding: "0 16px", borderRadius: 8, border: `1px solid #f59e0b40`, background: "transparent", color: "#f59e0b", textDecoration: "none", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          ⭐ {T.review}
                        </a>
                      </div>

                      {/* Chat with seller */}
                      {order.invoiceId && (
                        <div style={{ marginTop: 16, padding: "14px 16px", background: v.surface2, borderRadius: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{T.chatSeller}</div>
                          <textarea
                            value={expandedId === order.id ? chatMsg : ""} onChange={e => setChatMsg(e.target.value)}
                            placeholder={lang === "ru" ? "Ваше сообщение продавцу..." : "Your message to the seller..."}
                            rows={2}
                            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${v.border}`, borderRadius: 8, background: v.surface, color: v.tx, fontSize: 13, outline: "none", resize: "vertical", marginBottom: 8 }}
                            onFocus={e => e.target.style.borderColor = v.accent}
                            onBlur={e => e.target.style.borderColor = v.border}
                          />
                          <button onClick={() => sendMessage(order.invoiceId)} disabled={chatSending || !chatMsg.trim()} style={{ height: 34, padding: "0 18px", borderRadius: 8, border: "none", background: (chatSending || !chatMsg.trim()) ? v.surface3 : v.accent, color: (chatSending || !chatMsg.trim()) ? v.tx3 : "#fff", fontSize: 12, fontWeight: 700, cursor: (chatSending || !chatMsg.trim()) ? "not-allowed" : "pointer" }}>
                            {chatSending ? "..." : lang === "ru" ? "Отправить" : "Send Message"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {orders && orders.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "40px 0", color: v.tx3, fontSize: 13 }}>{T.noOrders}</div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function OrdersPageWrapper() {
  return <StoreProvider><OrdersPage /></StoreProvider>;
}
