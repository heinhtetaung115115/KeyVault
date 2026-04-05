"use client";

import { useStore } from "./StoreContext";

export default function ProductCard({ product, index = 0 }) {
  const { v, dark, t, cur } = useStore();

  const imageUrl = product.imageUrl || `https://graph.digiseller.ru/img.ashx?id_d=${product.id}&maxlength=400`;
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : product.discountPercent || 0;
  const fallbackImg = `https://placehold.co/360x200/${dark ? "1a1e28" : "e8eaef"}/${dark ? "525c72" : "9ca3b3"}?text=${encodeURIComponent((product.name || "Product").slice(0, 15))}&font=raleway`;

  const goToProduct = () => {
    window.location.href = `/product/${product.id}`;
  };

  const handleBuy = (e) => {
    e.stopPropagation();
    // Go to product page (user can buy from there)
    window.location.href = `/product/${product.id}`;
  };

  return (
    <div
      className="card"
      onClick={goToProduct}
      style={{
        background: v.surface, border: `1px solid ${v.border}`, borderRadius: 14,
        overflow: "hidden", cursor: "pointer", position: "relative",
        animation: `fadeUp .4s ease ${index * 30}ms both`,
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden", background: v.surface2 }}>
        <img className="card-img" src={imageUrl} alt={product.name} loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { e.target.src = fallbackImg; }}
        />
        <div style={{ position: "absolute", inset: 0, background: v.imgOverlay, pointerEvents: "none" }} />
        {product.platform && (
          <span style={{ position: "absolute", top: 10, left: 10, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: .3, background: dark ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.85)", backdropFilter: "blur(6px)", color: dark ? "#e0e0e0" : "#333" }}>{product.platform}</span>
        )}
        {discount > 0 && (
          <span style={{ position: "absolute", top: 10, right: 10, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: v.green, color: "#fff" }}>-{discount}%</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 37, color: v.tx }}>{product.name}</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {product.rating > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: v.tx2 }}>
              <span style={{ color: "#fbbf24" }}>★</span> {Number(product.rating).toFixed(1)}
            </span>
          )}
          {product.salesCount > 0 && (
            <span style={{ fontSize: 11, color: v.tx3 }}>{product.salesCount.toLocaleString()} {t.sold}</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -.5, color: discount > 0 ? v.green : v.tx }}>
              {cur.symbol}{Number(product.price).toFixed(2)}
            </span>
            {product.oldPrice && (
              <span style={{ fontSize: 12, color: v.tx3, textDecoration: "line-through", marginLeft: 6 }}>
                {cur.symbol}{Number(product.oldPrice).toFixed(2)}
              </span>
            )}
          </div>
          <button className="buy-btn" onClick={handleBuy} style={{
            height: 34, padding: "0 16px", border: "none", borderRadius: 8,
            background: v.accent, color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            {t.buyNow}
          </button>
        </div>
      </div>
    </div>
  );
}
