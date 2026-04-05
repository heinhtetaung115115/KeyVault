"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { StoreProvider, useStore } from "../../components/StoreContext";
import Header from "../../components/Header";
import { Footer } from "../../components/Extras";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";

const I = {
  bolt: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  shield: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  check: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  headset: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>,
  star: (c) => <svg width="14" height="14" viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  clock: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  box: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>,
  tag: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1"/></svg>,
  file: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  img: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  msg: (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
};

function fmtMod(v, cur) {
  if (v.modifyDisplay) return v.modifyDisplay;
  const r = v.rate; if (!r) return null;
  if (r > 0) return `+${cur.symbol}${r}`;
  if (r < 0) return `${cur.symbol}${r}`;
  return null;
}

function calcPrice(base, options, vals) {
  let p = base;
  (options || []).forEach(o => {
    if (!o.variants?.length) return;
    const v = o.variants.find(va => va.id == vals[o.id]);
    if (!v || !v.rate) return;
    p += v.rate;
  });
  return Math.max(0, p);
}

function ProductPage() {
  const { v, dark, t, cur, lang } = useStore();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [optionValues, setOptionValues] = useState({});
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true); setError(null);
    fetch(`/api/product?id=${productId}&lang=${lang}&currency=${cur.code}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.product) {
          setProduct(data.product);
          const defs = {};
          (data.product.options || []).forEach(opt => {
            if (opt.variants?.length > 0) {
              const d = opt.variants.find(va => va.isDefault) || opt.variants[0];
              defs[opt.id] = d.id;
            }
          });
          setOptionValues(defs);
        } else setError(lang === "ru" ? "Товар не найден" : "Product not found");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId, lang, cur.code]);

  const adjustedPrice = useMemo(() => product ? calcPrice(product.price, product.options, optionValues) : 0, [product, optionValues]);

  const validate = () => {
    const errs = {};
    (product?.options || []).forEach(opt => {
      if (!opt.required) return;
      const val = optionValues[opt.id];
      const tp = (opt.type || "").toLowerCase();
      if (tp === "text" || tp === "textarea" || tp === "input") {
        if (!val || !String(val).trim()) errs[opt.id] = lang === "ru" ? "Обязательное поле" : "This field is required";
      } else if (tp === "radio" || tp === "select") {
        if (val === undefined || val === null || val === "") errs[opt.id] = lang === "ru" ? "Выберите вариант" : "Please select an option";
      }
    });
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBuyNow = async () => {
    if (!product || buying) return;
    setBuyError("");
    if (product.inStock === false) { setBuyError(lang === "ru" ? "Товар закончился" : "Out of stock"); return; }
    if (!validate()) return;

    setBuying(true);
    try {
      const hasOptions = product.options?.length > 0;

      if (hasOptions) {
        const opts = product.options.map(opt => ({ id: opt.id, type: opt.type, value: String(optionValues[opt.id] ?? "") }));
        const res = await fetch("/api/product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, options: opts, lang, unitCnt: quantity }),
        });
        const data = await res.json();

        if (data.ok && data.id_po) {
          const ai = data.affiliateId || product.sellerId || "";
          const payUrl = `https://www.digiseller.market/asp2/pay_wm.asp?id_d=${product.id}&id_po=${data.id_po}&ai=${ai}&lang=${lang === "ru" ? "ru-RU" : "en-US"}`;
          window.open(payUrl, "_blank");
          setPurchased(true);
        } else {
          setBuyError(data.error || "Failed to process options");
        }
      } else {
        const url = `https://www.oplata.info/asp2/pay.asp?id_d=${product.id}&ai=${product.sellerId || ""}&lang=${lang === "ru" ? "ru-RU" : "en-US"}`;
        window.open(url, "_blank");
        setPurchased(true);
      }
    } catch (err) {
      setBuyError("Something went wrong. Please try again.");
    } finally {
      setBuying(false);
    }
  };

  const imageUrl = product?.imageUrl || `https://graph.digiseller.ru/img.ashx?id_d=${productId}&maxlength=600`;
  const fallback = `https://placehold.co/800x400/${dark ? "1a1e28" : "e8eaef"}/${dark ? "525c72" : "9ca3b3"}?text=Product&font=raleway`;
  const discount = product?.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const hasOpts = product?.options?.length > 0;
  const trustItems = [
    { icon: I.bolt, label: t.features[0], color: "#f59e0b", bg: dark ? "#261a04" : "#fffbeb" },
    { icon: I.shield, label: t.features[1], color: "#22c55e", bg: dark ? "#0d2818" : "#dcfce7" },
    { icon: I.check, label: t.features[2], color: "#3b82f6", bg: dark ? "#0c1e3d" : "#dbeafe" },
    { icon: I.headset, label: t.features[3], color: "#a855f7", bg: dark ? "#1e0a3a" : "#f3e8ff" },
  ];
  const tabDefs = [
    { id: "description", label: lang === "ru" ? "Описание" : "Description", icon: I.file },
    { id: "reviews", label: lang === "ru" ? "Отзывы" : "Reviews", icon: I.msg, count: product?.reviews?.length },
    { id: "images", label: lang === "ru" ? "Изображения" : "Images", icon: I.img },
  ];

  return (
    <div style={{ minHeight: "100vh", background: v.bg, color: v.tx, transition: "background .35s" }}>
      <Header onSearch={() => (window.location.href = "/")} storeName={STORE_NAME} />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "20px 20px 48px" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: v.tx3, textDecoration: "none", marginBottom: 20 }}
          onMouseEnter={e => e.currentTarget.style.color = v.accent} onMouseLeave={e => e.currentTarget.style.color = v.tx3}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>{t.back}
        </a>

        {loading ? <Skeleton v={v} /> : error || !product ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}><p style={{ color: v.tx2 }}>{error}</p>
            <a href="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 20px", borderRadius: 10, background: v.accent, color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>{t.back}</a></div>
        ) : (
          <div style={{ display: "flex", gap: 24, animation: "fadeUp .35s ease", flexWrap: "wrap" }}>
            {/* LEFT */}
            <div style={{ flex: "1 1 580px", minWidth: 0 }}>
              <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", marginBottom: 20, background: v.surface2, border: `1px solid ${v.border}` }}>
                <img src={imageUrl} alt={product.name} style={{ width: "100%", aspectRatio: "16/8", objectFit: "cover", display: "block" }} onError={e => { e.target.src = fallback; }} />
                {product.platform && <span style={{ position: "absolute", top: 14, left: 14, padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: dark ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.9)", backdropFilter: "blur(8px)", color: dark ? "#e0e0e0" : "#333" }}>{product.platform}</span>}
                {discount > 0 && <span style={{ position: "absolute", top: 14, right: 14, padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: v.green, color: "#fff" }}>-{discount}%</span>}
              </div>

              <h1 style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 800, lineHeight: 1.3, marginBottom: 8, letterSpacing: -.3 }}>{product.name}</h1>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, fontSize: 13, color: v.tx3, flexWrap: "wrap" }}>
                {product.salesCount > 0 && <span style={{ color: v.green }}>{lang === "ru" ? "Продано" : "Sold"} {product.salesCount.toLocaleString()}</span>}
                {product.reviews?.length > 0 && <><span>•</span><span style={{ color: v.accent, cursor: "pointer" }} onClick={() => setActiveTab("reviews")}>{lang === "ru" ? "Отзывы" : "Reviews"} {product.reviews.length}+</span></>}
              </div>

              {/* OPTIONS */}
              {hasOpts && (
                <div style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
                  {product.options.map((opt, oi) => {
                    const hasError = validationErrors[opt.id];
                    return (
                      <div key={opt.id} style={{ marginBottom: oi < product.options.length - 1 ? 18 : 0 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: v.tx, marginBottom: 10 }}>
                          {opt.name} {opt.required && <span style={{ color: v.red }}>*</span>}
                        </label>
                        {(opt.type === "radio" || opt.type === "select") && opt.variants?.length > 0 && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {opt.variants.map(va => {
                              const isSel = optionValues[opt.id] == va.id;
                              const mod = fmtMod(va, cur);
                              return (
                                <button key={va.id} onClick={() => { setOptionValues(prev => ({ ...prev, [opt.id]: va.id })); setValidationErrors(prev => { const n = { ...prev }; delete n[opt.id]; return n; }); }}
                                  style={{ height: 38, padding: "0 16px", borderRadius: 10, cursor: "pointer", border: `2px solid ${isSel ? v.accent : hasError ? v.red : v.border}`, background: isSel ? (dark ? v.accent + "15" : v.accent + "0a") : "transparent", color: isSel ? v.accent : v.tx, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all .15s", whiteSpace: "nowrap" }}>
                                  {va.name}
                                  {mod && <span style={{ fontSize: 11, fontWeight: 700, color: v.tx3 }}>{mod}</span>}
                                  {isSel && <span style={{ fontSize: 10, color: v.green, fontWeight: 500 }}>{lang === "ru" ? "выбрано" : "Selected"}</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {(opt.type === "text" || opt.type === "textarea" || opt.type === "input") && (
                          <input type="text" value={optionValues[opt.id] || ""} onChange={e => { setOptionValues(prev => ({ ...prev, [opt.id]: e.target.value })); setValidationErrors(prev => { const n = { ...prev }; delete n[opt.id]; return n; }); }}
                            placeholder={opt.comment || opt.name}
                            style={{ width: "100%", maxWidth: 480, height: 42, padding: "0 14px", border: `1px solid ${hasError ? v.red : v.border}`, borderRadius: 10, background: v.surface2, color: v.tx, fontSize: 13, outline: "none" }}
                            onFocus={e => e.target.style.borderColor = v.accent} onBlur={e => e.target.style.borderColor = hasError ? v.red : v.border} />
                        )}
                        {hasError && <div style={{ fontSize: 12, color: v.red, marginTop: 6 }}>{hasError}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TABS */}
              <div style={{ display: "flex", gap: 4, background: v.surface2, borderRadius: "12px 12px 0 0", padding: "6px 6px 0", border: `1px solid ${v.border}`, borderBottom: "none" }}>
                {tabDefs.map(tb => (
                  <button key={tb.id} onClick={() => setActiveTab(tb.id)} style={{ flex: 1, height: 42, border: "none", borderRadius: "8px 8px 0 0", background: activeTab === tb.id ? v.surface : "transparent", color: activeTab === tb.id ? v.tx : v.tx3, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderBottom: activeTab === tb.id ? `2px solid ${v.accent}` : "2px solid transparent" }}>
                    {tb.icon(activeTab === tb.id ? v.accent : v.tx3)}
                    <span className="tab-label">{tb.label}</span>
                    {tb.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: v.surface3, color: v.tx3 }}>{tb.count}+</span>}
                  </button>
                ))}
              </div>
              <div style={{ background: v.surface, border: `1px solid ${v.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "20px 24px", minHeight: 200 }}>
                {activeTab === "description" && <div style={{ fontSize: 14, color: v.tx2, lineHeight: 1.85 }}>
                  <div dangerouslySetInnerHTML={{ __html: product.fullDescription || product.description || t.descFallback }} />
                  {product.additionalInfo && <div style={{ marginTop: 16, padding: "14px 16px", background: v.surface2, borderRadius: 10, borderLeft: `3px solid ${v.accent}` }} dangerouslySetInnerHTML={{ __html: product.additionalInfo }} />}
                </div>}
                {activeTab === "reviews" && <div>{(!product.reviews?.length) ? <div style={{ textAlign: "center", padding: "32px 0", color: v.tx3, fontSize: 13 }}>{lang === "ru" ? "Отзывов пока нет" : "No reviews yet"}</div> :
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{product.reviews.map((r, i) => (
                    <div key={i} style={{ padding: "14px 16px", background: v.surface2, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: v.surface3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: v.tx2 }}>{(r.author || "B")[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: v.tx }}>{r.author}</div><div style={{ fontSize: 11, color: v.tx3 }}>{r.date ? new Date(r.date).toLocaleDateString() : ""}</div></div>
                        <div style={{ display: "flex", gap: 2 }}>{Array.from({ length: 5 }).map((_, si) => <span key={si}>{I.star(si < r.rating ? "#fbbf24" : v.border)}</span>)}</div>
                      </div>
                      <p style={{ fontSize: 13, color: v.tx2, lineHeight: 1.6 }}>{r.text}</p></div>))}</div>}</div>}
                {activeTab === "images" && <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${v.border}`, aspectRatio: "16/10" }}>
                      <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.src = fallback; }} /></div></div>
                  <p style={{ fontSize: 12, color: v.tx3, marginTop: 12 }}>{lang === "ru" ? "Изображения загружены продавцом" : "Images uploaded by seller"}</p></div>}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ flex: "0 0 320px", alignSelf: "flex-start", position: "sticky", top: 78 }}>
              <div style={{ background: v.surface, border: `1px solid ${v.border}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${v.border}` }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, color: discount > 0 ? v.green : v.tx }}>{cur.symbol}{adjustedPrice.toFixed(2)}</span>
                    {product.oldPrice && <span style={{ fontSize: 16, color: v.tx3, textDecoration: "line-through" }}>{cur.symbol}{Number(product.oldPrice).toFixed(2)}</span>}
                  </div>
                  {discount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: v.green, background: v.greenBg, padding: "3px 10px", borderRadius: 6 }}>{lang === "ru" ? `Скидка ${discount}%` : `Save ${discount}%`}</span>}
                  {adjustedPrice !== product.price && <div style={{ fontSize: 11, color: v.accent, marginTop: 6 }}>{lang === "ru" ? "Цена с опциями" : "Price with options"}</div>}
                </div>
                <div style={{ padding: "14px 22px", borderBottom: `1px solid ${v.border}`, display: "flex", flexDirection: "column", gap: 9 }}>
                  {product.platform && <Pr icon={I.tag} label={lang === "ru" ? "Платформа" : "Platform"} val={product.platform} clr={v.tx} v={v} />}
                  <Pr icon={I.clock} label={lang === "ru" ? "Доставка" : "Delivery"} val={lang === "ru" ? "Мгновенная" : "Instant"} clr={v.green} v={v} />
                  <Pr icon={I.box} label={lang === "ru" ? "Тип" : "Type"} val={lang === "ru" ? "Цифровой ключ" : "Digital key"} clr={v.tx} v={v} />
                  <Pr icon={() => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={v.tx3} strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>} label={lang === "ru" ? "Наличие" : "Stock"} val={product.inStock === false ? t.outOfStock : t.inStock} clr={product.inStock === false ? v.red : v.green} v={v} />
                  {product.salesCount > 0 && <Pr icon={() => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={v.tx3} strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>} label={lang === "ru" ? "Продажи" : "Sales"} val={product.salesCount.toLocaleString()} clr={v.tx} v={v} />}
                  {product.rating > 0 && <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: v.tx3, display: "flex", alignItems: "center", gap: 5 }}>{I.star("#fbbf24")} {lang === "ru" ? "Рейтинг" : "Rating"}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{Number(product.rating).toFixed(1)}</span>
                      {Array.from({ length: 5 }).map((_, i) => <span key={i}>{I.star(i < Math.round(product.rating) ? "#fbbf24" : v.border)}</span>)}
                    </div></div>}
                </div>
                <div style={{ padding: "16px 22px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 12, color: v.tx3 }}>{lang === "ru" ? "Кол-во" : "Qty"}</span>
                    <div style={{ display: "flex", border: `1px solid ${v.border}`, borderRadius: 8, overflow: "hidden" }}>
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 34, height: 34, border: "none", background: v.surface2, color: v.tx2, fontSize: 16, cursor: "pointer" }}>−</button>
                      <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1"
                        style={{ width: 44, height: 34, border: "none", borderLeft: `1px solid ${v.border}`, borderRight: `1px solid ${v.border}`, background: v.surface, color: v.tx, textAlign: "center", fontSize: 13, fontWeight: 600, outline: "none", MozAppearance: "textfield" }} />
                      <button onClick={() => setQuantity(quantity + 1)} style={{ width: 34, height: 34, border: "none", background: v.surface2, color: v.tx2, fontSize: 16, cursor: "pointer" }}>+</button>
                    </div>
                    {quantity > 1 && <span style={{ fontSize: 12, color: v.tx3, marginLeft: "auto" }}>= {cur.symbol}{(adjustedPrice * quantity).toFixed(2)}</span>}
                  </div>

                  {buyError && <div style={{ padding: "10px 14px", background: dark ? "#1a1520" : "#fef2f2", borderRadius: 8, marginBottom: 12, fontSize: 12, color: v.red }}>{buyError}</div>}

                  {purchased && (
                    <div style={{ padding: "12px 14px", background: dark ? "#0d2818" : "#dcfce7", border: `1px solid #22c55e30`, borderRadius: 10, marginBottom: 12, fontSize: 12, color: v.tx2, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700, color: v.green }}>✅ {lang === "ru" ? "Оплата открыта в новой вкладке" : "Payment opened in new tab"}</span><br/>
                      {lang === "ru" ? "Завершите оплату. После оплаты вы получите товар на странице Digiseller." : "Complete the payment. You'll receive your product on the Digiseller page."}
                    </div>
                  )}

                  <button onClick={handleBuyNow} disabled={buying || product.inStock === false} style={{ width: "100%", height: 48, border: "none", borderRadius: 10, background: product.inStock === false ? v.surface3 : buying ? "#666" : "linear-gradient(135deg,#3b82f6,#2563eb)", color: product.inStock === false ? v.tx3 : "#fff", fontSize: 15, fontWeight: 700, cursor: (buying || product.inStock === false) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: product.inStock === false ? "none" : "0 4px 14px rgba(37,99,235,.35)", transition: "transform .1s,opacity .15s", opacity: buying ? .7 : 1 }}>
                    {product.inStock === false ? (lang === "ru" ? "Нет в наличии" : "Out of Stock") : buying ? (lang === "ru" ? "Обработка..." : "Processing...") : t.buyNow}
                    {!buying && product.inStock !== false && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>}
                  </button>
                </div>
                <div style={{ padding: "0 22px 18px" }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {trustItems.map(it => (
                    <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: it.bg }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: it.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{it.icon(it.color)}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: v.tx2, lineHeight: 1.3 }}>{it.label}</span></div>
                  ))}</div></div>
                <div style={{ padding: "12px 22px", borderTop: `1px solid ${v.border}`, textAlign: "center" }}><span style={{ fontSize: 11, color: v.tx3 }}>{t.powered}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <style>{`@media(max-width:900px){.tab-label{font-size:11px!important}}@media(max-width:640px){.tab-label{display:none}}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}`}</style>
    </div>
  );
}

function Pr({ icon: Ic, label, val, clr, v }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: 12, color: v.tx3, display: "flex", alignItems: "center", gap: 5 }}>{typeof Ic === "function" ? Ic(v.tx3) : Ic} {label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: clr }}>{val}</span></div>;
}

function Skeleton({ v }) {
  return <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
    <div style={{ flex: "1 1 580px" }}>
      <div style={{ aspectRatio: "16/8", background: v.surface2, borderRadius: 14, marginBottom: 20, animation: "pulse 1.5s ease infinite" }} />
      <div style={{ height: 20, background: v.surface2, borderRadius: 5, width: "70%", marginBottom: 10 }} />
      <div style={{ height: 14, background: v.surface2, borderRadius: 4, width: "40%", marginBottom: 20 }} />
      <div style={{ height: 80, background: v.surface, border: `1px solid ${v.border}`, borderRadius: 12, marginBottom: 16 }} />
      <div style={{ height: 42, background: v.surface2, borderRadius: "12px 12px 0 0" }} />
      <div style={{ height: 180, background: v.surface, border: `1px solid ${v.border}`, borderRadius: "0 0 12px 12px" }} />
    </div>
    <div style={{ flex: "0 0 320px" }}><div style={{ height: 500, background: v.surface, border: `1px solid ${v.border}`, borderRadius: 14, animation: "pulse 1.5s ease infinite" }} /></div>
  </div>;
}

export default function W() { return <StoreProvider><ProductPage /></StoreProvider>; }
