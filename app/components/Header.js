"use client";

import { useState } from "react";
import { useStore } from "./StoreContext";

export default function Header({ onSearch, storeName = "KeyVault" }) {
  const { dark, toggleTheme, v, lang, switchLang, cur } = useStore();
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => { e.preventDefault(); onSearch?.(query); };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: v.headerBg, backdropFilter: "blur(14px) saturate(1.6)", borderBottom: `1px solid ${v.border}` }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 20px", height: 58, display: "flex", alignItems: "center", gap: 14 }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: v.tx, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>K</div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -.7 }}>{storeName}</span>
        </a>

        {/* Search */}
        <form onSubmit={handleSubmit} className="header-search" style={{ flex: 1, maxWidth: 400, position: "relative" }}>
          <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: v.tx3, pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7.5" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={lang === "ru" ? "Поиск игр, ключей, карт..." : "Search games, keys, cards..."}
            style={{ width: "100%", height: 38, paddingLeft: 38, paddingRight: 14, border: `1px solid ${v.border}`, borderRadius: 10, background: v.surface, color: v.tx, fontSize: 13, outline: "none", transition: "border-color .2s" }}
            onFocus={(e) => (e.target.style.borderColor = v.accent)} onBlur={(e) => (e.target.style.borderColor = v.border)}
          />
        </form>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {/* My Orders link */}
          <a href="/orders" style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1px solid ${v.border}`, background: "transparent", color: v.tx2, textDecoration: "none", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = v.surface3; e.currentTarget.style.color = v.tx; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = v.tx2; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M16 2v4M8 2v4M2 10h20" /></svg>
            <span className="lang-label">{lang === "ru" ? "Заказы" : "Orders"}</span>
          </a>

          {/* Language Switcher */}
          <div style={{ display: "flex", borderRadius: 8, border: `1px solid ${v.border}`, overflow: "hidden" }}>
            <button
              onClick={() => switchLang("en")}
              style={{
                height: 34, padding: "0 10px", border: "none",
                background: lang === "en" ? v.surface3 : "transparent",
                color: lang === "en" ? v.tx : v.tx3,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 14 }}>🇬🇧</span>
              <span className="lang-label">EN</span>
            </button>
            <button
              onClick={() => switchLang("ru")}
              style={{
                height: 34, padding: "0 10px", border: "none", borderLeft: `1px solid ${v.border}`,
                background: lang === "ru" ? v.surface3 : "transparent",
                color: lang === "ru" ? v.tx : v.tx3,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 14 }}>🇷🇺</span>
              <span className="lang-label">RU</span>
            </button>
          </div>

          {/* Currency display */}
          <span style={{ fontSize: 12, fontWeight: 700, color: v.tx2, padding: "0 6px", display: "flex", alignItems: "center", gap: 3 }}>
            {cur.symbol} {cur.code}
          </span>

          {/* Theme toggle */}
          <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${v.border}`, background: "transparent", color: v.tx2, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}
