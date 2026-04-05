"use client";

import { useState, useEffect } from "react";
import { useStore } from "./StoreContext";

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

export default function ProductModal({ product, onClose }) {
  const { addToCart, v, dark } = useStore();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!product) return;
    setLoading(true);
    fetch(`/api/product?id=${product.id}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok && data.product) setDetails(data.product); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [product]);

  if (!product) return null;
  const p = details || product;
  const imageUrl = p.imageUrl || `https://graph.digiseller.ru/img.ashx?id_d=${p.id}&maxlength=600`;
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const fallbackImg = `https://placehold.co/560x315/${dark ? "1a1e28" : "e8eaef"}/${dark ? "525c72" : "9ca3b3"}?text=${encodeURIComponent((p.name || "").slice(0, 18))}&font=raleway`;

  const handleBuy = () => {
    const url = p.paymentUrl || `/api/checkout?id=${p.id}`;
    window.open(url, "_blank");
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "85vh", overflow: "auto", position: "relative", animation: "fadeUp .25s ease" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, zIndex: 5, width: 30, height: 30, borderRadius: "50%", border: "none", background: dark ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.8)", backdropFilter: "blur(4px)", color: v.tx2, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        <img src={imageUrl} alt={p.name} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: "16px 16px 0 0", display: "block" }} onError={(e) => { e.target.src = fallbackImg; }} />

        <div style={{ padding: "20px 22px 22px" }}>
          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {p.platform && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: v.surface2, color: v.tx2 }}>{p.platform}</span>}
            {p.rating > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: v.surface2, color: v.tx2 }}>★ {Number(p.rating).toFixed(1)}</span>}
            {p.salesCount > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: v.surface2, color: v.tx2 }}>{p.salesCount.toLocaleString()} sold</span>}
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: v.greenBg, color: v.green }}>{p.inStock === false ? "Out of Stock" : "In Stock"}</span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.35, marginBottom: 14, letterSpacing: -.3, color: v.tx }}>{p.name}</h2>

          {/* Description */}
          <div style={{ fontSize: 13, color: v.tx2, lineHeight: 1.7, marginBottom: 20 }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ height: 12, background: v.surface2, borderRadius: 4, width: "100%" }} />
                <div style={{ height: 12, background: v.surface2, borderRadius: 4, width: "80%" }} />
                <div style={{ height: 12, background: v.surface2, borderRadius: 4, width: "60%" }} />
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: p.fullDescription || p.description || "Instant digital delivery. Your key is sent automatically after payment. Verified seller with buyer protection." }} />
            )}
          </div>

          {/* Features */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
            {[["⚡", "Instant delivery"], ["🛡", "Buyer protection"], ["✓", "Verified seller"], ["💬", "24/7 support"]].map(([ic, tx]) => (
              <div key={tx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: v.tx2, padding: "9px 12px", background: v.surface2, borderRadius: 8 }}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{ic}</span>{tx}
              </div>
            ))}
          </div>

          {/* Reviews */}
          {details?.reviews?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: v.tx }}>Recent reviews</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {details.reviews.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: v.surface2, borderRadius: 8, fontSize: 12, color: v.tx2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ color: "#fbbf24" }}>{"★".repeat(Math.min(5, Math.max(1, r.rating)))}</span>
                      <span style={{ fontWeight: 600, color: v.tx }}>{r.author}</span>
                    </div>
                    <p>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: v.surface2, borderRadius: 12, flexWrap: "wrap", gap: 12 }}>
            <div>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: discount > 0 ? v.green : v.tx }}>
                {CURRENCY}{Number(p.price).toFixed(2)}
              </span>
              {p.oldPrice && <span style={{ fontSize: 14, color: v.tx3, textDecoration: "line-through", marginLeft: 8 }}>{CURRENCY}{Number(p.oldPrice).toFixed(2)}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { addToCart(p); onClose(); }} style={{ height: 42, padding: "0 18px", borderRadius: 10, border: `1px solid ${v.border}`, background: "transparent", color: v.tx, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add to cart</button>
              <button className="buy-btn" onClick={handleBuy} style={{ height: 42, padding: "0 22px", borderRadius: 10, border: "none", background: v.accent, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Buy now →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
