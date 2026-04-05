"use client";

import { useStore } from "./StoreContext";

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

export default function CartDrawer() {
  const { cart, cartTotal, showCart, setShowCart, removeFromCart, clearCart, v, dark } = useStore();

  if (!showCart) return null;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: cart.map((p) => p.id), lang: "en" }),
      });
      const data = await res.json();
      if (data.ok && data.paymentUrl) window.open(data.paymentUrl, "_blank");
      else if (data.individualUrls?.length) window.open(data.individualUrls[0].url, "_blank");
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <>
      <div onClick={() => setShowCart(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 300 }} />
      <div style={{ position: "fixed", top: 0, right: 0, width: 370, maxWidth: "92vw", height: "100vh", background: v.surface, borderLeft: `1px solid ${v.border}`, zIndex: 301, display: "flex", flexDirection: "column", animation: "slideIn .25s ease" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${v.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: v.tx }}>Cart ({cart.length})</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {cart.length > 0 && (
              <button onClick={clearCart} style={{ border: "none", background: "none", color: v.tx3, fontSize: 11, cursor: "pointer" }}>Clear</button>
            )}
            <button onClick={() => setShowCart(false)} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: v.surface2, color: v.tx3, cursor: "pointer", fontSize: 13 }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "8px 20px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: v.tx3, fontSize: 13 }}>Cart is empty</div>
          ) : (
            cart.map((p) => {
              const imgUrl = p.imageUrl || `https://graph.digiseller.ru/img.ashx?id_d=${p.id}&maxlength=120`;
              return (
                <div key={p.id} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: `1px solid ${v.border}`, alignItems: "center" }}>
                  <img src={imgUrl} alt="" style={{ width: 52, height: 30, borderRadius: 6, objectFit: "cover", background: v.surface2 }}
                    onError={(e) => { e.target.src = `https://placehold.co/52x30/${dark ? "1a1e28" : "e8eaef"}/${dark ? "525c72" : "9ca3b3"}?text=...&font=raleway`; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: v.tx }}>{p.name}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, color: v.tx }}>{CURRENCY}{Number(p.price).toFixed(2)}</div>
                  </div>
                  <button onClick={() => removeFromCart(p.id)} style={{ border: "none", background: "none", color: v.tx3, cursor: "pointer", fontSize: 14, padding: 4 }}>✕</button>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${v.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 14, color: v.tx }}>
              <span>Total</span><span>{CURRENCY}{cartTotal.toFixed(2)}</span>
            </div>
            <button className="buy-btn" onClick={handleCheckout} style={{ width: "100%", height: 44, border: "none", borderRadius: 10, background: v.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Checkout via Digiseller
            </button>
            <p style={{ textAlign: "center", fontSize: 10, color: v.tx3, marginTop: 8 }}>Secure payment by Digiseller</p>
          </div>
        )}
      </div>
    </>
  );
}
