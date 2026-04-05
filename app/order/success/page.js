"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";

function SuccessContent() {
  const searchParams = useSearchParams();
  const uniqueCode = searchParams.get("uniquecode") || searchParams.get("UniqueCode") || "";
  const productId = searchParams.get("id_d") || searchParams.get("ID_D") || "";
  const payUid = searchParams.get("pay_uid") || searchParams.get("puid") || "";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("purchase");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrder = useCallback(() => {
    if (!uniqueCode) { setLoading(false); return; }
    fetch(`/api/order?code=${encodeURIComponent(uniqueCode)}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setOrder(data.order);
        else setError(data.error);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [uniqueCode]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const sendMessage = async () => {
    if (!message.trim() || !order?.invoiceId || sending) return;
    setSending(true);
    try {
      await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: order.invoiceId, message }),
      });
      setMessage("");
      // Refresh to get new messages
      fetchOrder();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(uniqueCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Colors
  const v = {
    bg: "#f5f6f8", surface: "#fff", surface2: "#f0f1f4", border: "#dfe2e8",
    tx: "#15181e", tx2: "#6b7385", tx3: "#9ca3b3",
    accent: "#3b82f6", green: "#16a34a", greenBg: "#dcfce7",
    red: "#dc2626", redBg: "#fef2f2", orange: "#ea580c", orangeBg: "#fff7ed",
    blue: "#2563eb", blueBg: "#dbeafe",
  };

  return (
    <div style={{ minHeight: "100vh", background: v.bg, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: v.tx }}>
      {/* Header */}
      <header style={{ background: v.surface, borderBottom: `1px solid ${v.border}`, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 900, margin: "0 auto" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: v.tx }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>K</div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{STORE_NAME}</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: v.accent, textDecoration: "none", fontWeight: 600 }}>← Back to store</a>
      </header>

      <div style={{ maxWidth: 750, margin: "0 auto", padding: "24px 20px 48px" }}>

        {/* Success banner */}
        <div style={{ background: v.greenBg, border: `1px solid ${v.green}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: v.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#15803d" }}>Payment successful!</div>
            <div style={{ fontSize: 13, color: "#166534", marginTop: 2 }}>Your purchase is complete. See details below.</div>
          </div>
        </div>

        {/* Unique code box */}
        {uniqueCode && (
          <div style={{ background: v.orangeBg, border: `1px solid ${v.orange}30`, borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: v.orange, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>Your unique code</div>
              <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: v.tx, wordBreak: "break-all" }}>{uniqueCode}</div>
            </div>
            <button onClick={copyCode} style={{ height: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${v.orange}40`, background: "transparent", color: v.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 24, height: 24, border: `2px solid ${v.border}`, borderTopColor: v.accent, borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: v.tx3, fontSize: 13 }}>Loading order details...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !order ? (
          /* No order data — show basic success */
          <div style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: 12, padding: "24px", textAlign: "center" }}>
            <p style={{ color: v.tx2, fontSize: 14, marginBottom: 16 }}>
              {error || "Thank you for your purchase! Check your email for delivery details."}
            </p>
            <a href="/" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: v.accent, color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Continue shopping</a>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${v.border}`, marginBottom: 0 }}>
              {[
                { id: "purchase", label: "Your Purchase" },
                { id: "chat", label: `Chat with Seller${order.messages?.length > 0 ? ` (${order.messages.length})` : ""}` },
                { id: "review", label: "Leave Review" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "12px 20px", border: "none", background: "transparent",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  color: activeTab === tab.id ? v.accent : v.tx3,
                  borderBottom: activeTab === tab.id ? `2px solid ${v.accent}` : "2px solid transparent",
                  transition: "all .15s",
                }}>{tab.label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ background: v.surface, border: `1px solid ${v.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "24px" }}>

              {/* ── PURCHASE TAB ── */}
              {activeTab === "purchase" && (
                <div>
                  {/* Delivered content */}
                  {order.content && (
                    <div style={{ background: v.blueBg, border: `1px solid ${v.blue}25`, borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
                      <div style={{ fontSize: 11, color: v.blue, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Delivered content</div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: v.tx, wordBreak: "break-all", userSelect: "all" }}>{order.content}</div>
                    </div>
                  )}

                  {/* Order details table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <tbody>
                      {[
                        ["Order:", <span key="o"><strong>{order.orderId}</strong> <span style={{ color: v.tx3 }}>for {order.amount} {order.currency}</span> <span style={{ color: v.tx3 }}>created {order.date ? new Date(order.date).toLocaleString() : ""}</span></span>],
                        ["Payment status:", <span key="s" style={{ color: v.green, fontWeight: 600 }}>✅ paid</span>],
                        ["Product name:", <a key="p" href={`/product/${order.productId}`} style={{ color: v.accent, fontWeight: 600, textDecoration: "none" }}>{order.productName}</a>],
                        order.options?.length > 0 ? ["Product options:", order.options.map((o, i) => <span key={i}>{typeof o === "string" ? o : `${o.name || o.label || ""}: ${o.value || o.text || ""}`}{i < order.options.length - 1 ? ", " : ""}</span>)] : null,
                      ].filter(Boolean).map(([label, value], i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${v.border}` }}>
                          <td style={{ padding: "12px 0", color: v.tx3, width: 140, verticalAlign: "top" }}>{label}</td>
                          <td style={{ padding: "12px 0" }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Seller info */}
                  {order.seller?.name && (
                    <div style={{ marginTop: 20, padding: "16px 18px", background: v.surface2, borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: v.tx3, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: .5 }}>Seller</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{order.seller.name}</div>
                      {order.seller.email && (
                        <div style={{ fontSize: 13, color: v.tx2, display: "flex", alignItems: "center", gap: 6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={v.tx3} strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" /></svg>
                          {order.seller.email}
                        </div>
                      )}
                      <button onClick={() => setActiveTab("chat")} style={{ marginTop: 10, height: 34, padding: "0 16px", borderRadius: 8, border: `1px solid ${v.accent}`, background: "transparent", color: v.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Chat with seller
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── CHAT TAB ── */}
              {activeTab === "chat" && (
                <div>
                  {/* Messages */}
                  <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 16 }}>
                    {(!order.messages || order.messages.length === 0) ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: v.tx3, fontSize: 13 }}>No messages yet. Send a message to the seller below.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {order.messages.map((m, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: m.isSeller ? "flex-start" : "flex-end" }}>
                            <div style={{
                              maxWidth: "75%", padding: "10px 14px", borderRadius: 12,
                              background: m.isSeller ? v.surface2 : v.blueBg,
                              borderBottomLeftRadius: m.isSeller ? 4 : 12,
                              borderBottomRightRadius: m.isSeller ? 12 : 4,
                            }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: m.isSeller ? v.green : v.accent, marginBottom: 3 }}>{m.author}</div>
                              <div style={{ fontSize: 13, color: v.tx, lineHeight: 1.5 }}>{m.text}</div>
                              <div style={{ fontSize: 10, color: v.tx3, marginTop: 4 }}>{m.date ? new Date(m.date).toLocaleString() : ""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Send message */}
                  {order.invoiceId && (
                    <div>
                      <textarea
                        value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Type your message to the seller..."
                        rows={3}
                        style={{ width: "100%", padding: "12px 14px", border: `1px solid ${v.border}`, borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical", color: v.tx }}
                        onFocus={e => e.target.style.borderColor = v.accent}
                        onBlur={e => e.target.style.borderColor = v.border}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                        <span style={{ fontSize: 11, color: v.tx3 }}>Messages are reviewed by the marketplace</span>
                        <button onClick={sendMessage} disabled={sending || !message.trim()} style={{
                          height: 40, padding: "0 24px", borderRadius: 8, border: "none",
                          background: (sending || !message.trim()) ? v.surface2 : v.accent,
                          color: (sending || !message.trim()) ? v.tx3 : "#fff",
                          fontSize: 13, fontWeight: 700, cursor: (sending || !message.trim()) ? "not-allowed" : "pointer",
                        }}>
                          {sending ? "Sending..." : "Send Message"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!order.invoiceId && (
                    <div style={{ textAlign: "center", padding: "16px 0", color: v.tx3, fontSize: 13 }}>
                      Chat is not available for this order.
                    </div>
                  )}
                </div>
              )}

              {/* ── REVIEW TAB ── */}
              {activeTab === "review" && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={v.orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: .6 }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Leave a review</h3>
                  <p style={{ fontSize: 13, color: v.tx2, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px", lineHeight: 1.5 }}>
                    Your feedback helps other buyers and motivates sellers to provide better service.
                  </p>

                  {payUid ? (
                    <a
                      href={`https://digiseller.market/resultpage?puid=${payUid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        height: 44, padding: "0 28px", borderRadius: 10,
                        background: v.accent, color: "#fff", textDecoration: "none",
                        fontSize: 14, fontWeight: 700,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      Write Review on Digiseller
                    </a>
                  ) : (
                    <p style={{ fontSize: 13, color: v.tx3 }}>Review link is not available for this order.</p>
                  )}

                  <p style={{ fontSize: 11, color: v.tx3, marginTop: 12 }}>
                    Good feedback may be rewarded by the seller
                  </p>
                </div>
              )}
            </div>

            {/* Continue shopping */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 42, padding: "0 24px", borderRadius: 10, background: v.surface, border: `1px solid ${v.border}`, color: v.tx2, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                ← Continue shopping
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <p style={{ color: "#9ca3b3" }}>Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
