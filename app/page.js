"use client";

import { useState, useEffect, useCallback } from "react";
import { StoreProvider, useStore } from "./components/StoreContext";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import { Footer, ProductGridSkeleton } from "./components/Extras";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "KeyVault";

function HomePage() {
  const { v, t, cur, lang } = useStore();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Re-fetch categories when language changes
  useEffect(() => {
    fetch(`/api/categories?lang=${lang}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok) setCategories(data.categories || []); })
      .catch(console.error);
  }, [lang]);

  // Re-fetch products when language, currency, category, search, sort, or page changes
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // For "All" (recommended), request 30 products; for specific category, 20
      const fetchRows = (!activeCategory && !searchQuery) ? "30" : "20";
      const params = new URLSearchParams({ page: String(page), rows: fetchRows, order: sortBy, lang, currency: cur.code });
      if (activeCategory) params.set("category_id", String(activeCategory));
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.ok) { setProducts(data.products || []); setTotalPages(data.totalPages || 1); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activeCategory, searchQuery, sortBy, page, lang, cur.code]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleCategoryChange = (id) => { setActiveCategory(id); setPage(1); };
  const handleSearch = (q) => { setSearchQuery(q); setActiveCategory(null); setPage(1); };

  const flatCats = categories.flatMap((c) => [c, ...(c.subcategories || [])]);

  return (
    <div style={{ minHeight: "100vh", background: v.bg, color: v.tx, transition: "background .35s, color .35s" }}>
      <Header onSearch={handleSearch} storeName={STORE_NAME} />

      {/* Hero */}
      <section style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 20px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(24px,4.5vw,40px)", fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.15, marginBottom: 8 }}>
          {t.hero1}{" "}
          <span style={{ background: "linear-gradient(90deg,#3b82f6,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.hero2}</span>
        </h1>
        <p style={{ fontSize: 14, color: v.tx2, maxWidth: 460, margin: "0 auto 20px", lineHeight: 1.55 }}>{t.heroSub}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {t.trust.map((b) => <span key={b} style={{ fontSize: 12, color: v.tx2 }}>{b}</span>)}
        </div>
      </section>

      {/* Categories */}
      <div className="hide-sb" style={{ maxWidth: 1160, margin: "0 auto", padding: "0 20px 16px", display: "flex", gap: 6, overflowX: "auto" }}>
        <button onClick={() => handleCategoryChange(null)} style={{ height: 34, padding: "0 16px", borderRadius: 8, border: !activeCategory ? "none" : `1px solid ${v.border}`, background: !activeCategory ? v.accent : "transparent", color: !activeCategory ? "#fff" : v.tx2, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{t.all}</button>
        {flatCats.map((c) => (
          <button key={c.id} onClick={() => handleCategoryChange(c.id)} style={{ height: 34, padding: "0 16px", borderRadius: 8, border: activeCategory === c.id ? "none" : `1px solid ${v.border}`, background: activeCategory === c.id ? v.accent : "transparent", color: activeCategory === c.id ? "#fff" : v.tx2, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {c.name}{c.count > 0 && <span style={{ marginLeft: 4, opacity: .5, fontSize: 10 }}>{c.count}</span>}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!activeCategory && !searchQuery && (
            <span style={{ fontSize: 16, fontWeight: 700, color: v.tx }}>{lang === "ru" ? "Рекомендуемые" : "Recommended"}</span>
          )}
          <span style={{ fontSize: 12, color: v.tx3 }}>{loading ? t.loading : `${products.length} ${t.products}`}</span>
        </div>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} style={{ height: 32, padding: "0 10px", borderRadius: 8, border: `1px solid ${v.border}`, background: v.surface, color: v.tx2, fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="rating">{t.topRated}</option>
          <option value="price">{t.priceLow}</option>
          <option value="price_desc">{t.priceHigh}</option>
          <option value="name">{t.nameAZ}</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 20px 48px" }}>
        {loading ? <ProductGridSkeleton count={8} /> : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: v.tx3, fontSize: 13 }}>
            {t.noProducts}{" "}
            {searchQuery && <button onClick={() => handleSearch("")} style={{ color: v.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>{t.clearSearch}</button>}
          </div>
        ) : (
          <>
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 28 }}>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: `1px solid ${v.border}`, background: "transparent", color: v.tx2, fontSize: 12, fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? .3 : 1 }}>{t.prev}</button>
                <span style={{ fontSize: 12, color: v.tx3, padding: "0 8px" }}>{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ height: 36, padding: "0 16px", borderRadius: 8, border: `1px solid ${v.border}`, background: "transparent", color: v.tx2, fontSize: 12, fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? .3 : 1 }}>{t.next}</button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <StoreProvider>
      <HomePage />
    </StoreProvider>
  );
}
