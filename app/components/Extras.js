"use client";

import { useStore } from "./StoreContext";

export function Footer() {
  const { v, t } = useStore();
  const name = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";
  return (
    <footer style={{ borderTop: `1px solid ${v.border}`, padding: "32px 20px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
        {t.footer.map((l) => (
          <a key={l} href="#" style={{ fontSize: 12, color: v.tx3, textDecoration: "none" }}>{l}</a>
        ))}
      </div>
      <p style={{ fontSize: 11, color: v.tx3 }}>© {new Date().getFullYear()} {name} — {t.powered}</p>
    </footer>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  const { v } = useStore();
  return (
    <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ aspectRatio: "16/9", background: v.surface2, animation: "pulse 1.5s ease infinite" }} />
          <div style={{ padding: "12px 14px 14px" }}>
            <div style={{ height: 13, background: v.surface2, borderRadius: 4, marginBottom: 8, width: "90%" }} />
            <div style={{ height: 13, background: v.surface2, borderRadius: 4, marginBottom: 8, width: "65%" }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ height: 11, background: v.surface2, borderRadius: 3, width: 40 }} />
              <div style={{ height: 11, background: v.surface2, borderRadius: 3, width: 55 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ height: 18, background: v.surface2, borderRadius: 4, width: 60 }} />
              <div style={{ height: 34, background: v.surface2, borderRadius: 8, width: 80 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
