"use client";

import { useState, useEffect, useCallback } from "react";

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";

// ═══════════════════════════════════════════════════
//  AUTH GATE
// ═══════════════════════════════════════════════════

function LoginForm({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (data.ok) {
        onLogin();
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-[var(--text-primary)] rounded-xl flex items-center justify-center text-white text-lg font-semibold">
            KV
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{STORE_NAME}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <input
            type="text"
            placeholder="Username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full h-11 px-4 border border-[var(--border)] rounded-xl bg-white text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full h-11 px-4 border border-[var(--border)] rounded-xl bg-white text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  STAT CARD
// ═══════════════════════════════════════════════════

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-4">
      <div className="text-xs text-[var(--text-tertiary)] mb-1">{label}</div>
      <div className={`text-2xl font-semibold tracking-tight ${accent ? "text-[var(--accent)]" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-[var(--text-tertiary)] mt-1">{sub}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  SALES TAB
// ═══════════════════════════════════════════════════

function SalesTab() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sales?top=100")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setSales(data.sales || []);
          setStats(data.stats || {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total sales" value={stats.totalSales || 0} />
        <StatCard label="Total revenue" value={`${CURRENCY}${(stats.totalRevenue || 0).toLocaleString()}`} accent />
        <StatCard label="Today's sales" value={stats.todaySales || 0} />
        <StatCard label="Avg order value" value={`${CURRENCY}${(stats.avgOrderValue || 0).toFixed(2)}`} />
      </div>

      {/* Sales table */}
      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">Recent sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-tertiary)]">
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">Buyer</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                    No sales data yet
                  </td>
                </tr>
              ) : (
                sales.map((s, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]/50">
                    <td className="px-4 py-3 font-mono text-xs">#{s.id || i + 1}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{s.productName}</td>
                    <td className="px-4 py-3 font-semibold">{CURRENCY}{s.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{s.buyerEmail || "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)] text-xs whitespace-nowrap">
                      {s.date ? new Date(s.date).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.isDelivered
                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                            : "bg-[var(--warning-soft)] text-[var(--warning)]"
                        }`}
                      >
                        {s.isDelivered ? "Delivered" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MESSAGES TAB
// ═══════════════════════════════════════════════════

function MessagesTab() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const loadChats = useCallback(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setChats(data.chats || []);
          setTotalUnread(data.totalUnread || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  const loadMessages = (chatId) => {
    setActiveChat(chatId);
    setMessages([]);
    fetch(`/api/admin/messages?id=${chatId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setMessages(data.messages || []);
      })
      .catch(console.error);
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeChat) return;
    setSending(true);
    try {
      await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeChat, message: reply }),
      });
      setReply("");
      loadMessages(activeChat);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
      <div className="flex h-full">
        {/* Chat list */}
        <div className="w-[320px] border-r border-[var(--border)] flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">
              Conversations
              {totalUnread > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] bg-[var(--danger-soft)] text-[var(--danger)]">
                  {totalUnread} unread
                </span>
              )}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-tertiary)]">No conversations</div>
            ) : (
              chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadMessages(c.id)}
                  className={`px-4 py-3 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors ${
                    activeChat === c.id ? "bg-[var(--bg-elevated)]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate max-w-[180px]">{c.buyerName}</span>
                    {c.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate">{c.productName}</div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{c.lastMessage}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 flex flex-col">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] px-3.5 py-2.5 rounded-xl text-sm ${
                        m.isAdmin
                          ? "bg-[var(--accent)] text-white rounded-br-md"
                          : "bg-[var(--bg-elevated)] rounded-bl-md"
                      }`}
                    >
                      <div className="mb-1">{m.text}</div>
                      <div className={`text-[10px] ${m.isAdmin ? "text-white/60" : "text-[var(--text-tertiary)]"}`}>
                        {m.date ? new Date(m.date).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-sm text-[var(--text-tertiary)] py-8">No messages in this conversation</div>
                )}
              </div>

              {/* Reply box */}
              <div className="border-t border-[var(--border)] p-3 flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Type a reply..."
                  className="flex-1 h-10 px-4 border border-[var(--border)] rounded-xl text-sm outline-none focus:border-[var(--accent)] transition-all"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="h-10 px-5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  PRODUCTS TAB
// ═══════════════════════════════════════════════════

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(() => {
    fetch("/api/admin/products?rows=50")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProducts(data.products || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const toggleProduct = async (productId, currentState) => {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, action: "toggle", value: !currentState }),
    });
    loadProducts();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">{products.length} products</span>
        <a
          href="https://my.digiseller.com/inside/goods.asp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Manage on Digiseller →
        </a>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-tertiary)]">
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">Price</th>
                <th className="px-4 py-2.5 font-medium">Sales</th>
                <th className="px-4 py-2.5 font-medium">Stock</th>
                <th className="px-4 py-2.5 font-medium">Platform</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-md object-cover bg-[var(--bg-elevated)]"
                          onError={(e) => { e.target.src = "https://placehold.co/40x40/f5f5f4/a8a29e?text=..."; }}
                        />
                        <span className="max-w-[220px] truncate font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">{p.id}</td>
                    <td className="px-4 py-3 font-semibold">{CURRENCY}{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{p.salesCount}</td>
                    <td className="px-4 py-3">
                      <span className={p.contentCount > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                        {p.contentCount > 0 ? p.contentCount : "Out"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{p.platform}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleProduct(p.id, p.isEnabled)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                          p.isEnabled
                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                            : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isEnabled ? "bg-[var(--success)]" : "bg-[var(--text-tertiary)]"}`} />
                        {p.isEnabled ? "Active" : "Disabled"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  LOADING SPINNER
// ═══════════════════════════════════════════════════

function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  MAIN DASHBOARD
// ═══════════════════════════════════════════════════

const TABS = [
  { id: "sales", label: "Sales", icon: "📊" },
  { id: "messages", label: "Support", icon: "💬" },
  { id: "products", label: "Products", icon: "📦" },
];

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("sales");

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Admin header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[var(--text-primary)] rounded-md flex items-center justify-center text-white text-xs font-semibold">KV</div>
              <span className="text-sm font-semibold tracking-tight">{STORE_NAME}</span>
            </a>
            <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              View store →
            </a>
            <button
              onClick={handleLogout}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--bg-elevated)] rounded-xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "sales" && <SalesTab />}
        {activeTab === "messages" && <MessagesTab />}
        {activeTab === "products" && <ProductsTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  PAGE WRAPPER
// ═══════════════════════════════════════════════════

export default function AdminPage() {
  const [authed, setAuthed] = useState(null); // null = checking, true/false = known

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((data) => setAuthed(data.authenticated === true))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <Loading />;
  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}
