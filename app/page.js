'use client';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from './components/StoreContext';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';
import Footer from './components/Footer';
import { ProductGridSkeleton } from './components/Skeletons';

export default function Home() {
  const { locale, t } = useStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('recommended');
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (search) params.set('search', search);
      if (activeSort !== 'recommended') params.set('sort', activeSort);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, [activeCategory, activeSort, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounced search
  const [searchTimer, setSearchTimer] = useState(null);
  const handleSearch = (val) => {
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setSearch(val), 300));
  };

  const sortOptions = [
    { key: 'recommended', label: t('recommended') },
    { key: 'price_asc', label: t('price_low') },
    { key: 'price_desc', label: t('price_high') },
    { key: 'name', label: t('name_az') },
  ];

  return (
    <>
      <Header onSearch={handleSearch} />
      <CartDrawer />
      <Toast />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '48px 0 32px' }}>
          <h1 style={{
            fontSize: 32, fontWeight: 700, margin: 0,
            lineHeight: 1.2,
          }}>
            {t('hero_title')}
          </h1>
          <p style={{
            color: 'var(--text-secondary)', fontSize: 15,
            maxWidth: 520, margin: '12px auto 0',
            lineHeight: 1.6,
          }}>
            {t('hero_subtitle')}
          </p>

          {/* Trust badges */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            flexWrap: 'wrap', gap: 8, marginTop: 20,
          }}>
            <span className="trust-badge">⚡ {t('badge_instant')}</span>
            <span className="trust-badge">🛡 {t('badge_protected')}</span>
            <span className="trust-badge">✓ {t('badge_verified')}</span>
            <span className="trust-badge">💳 {t('badge_secure')}</span>
          </div>
        </section>

        {/* Category chips */}
        <div className="chips-scroll" style={{ marginBottom: 16 }}>
          <button
            className={`chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            {t('all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`chip ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.slug)}
            >
              {locale === 'ru' && cat.name_ru ? cat.name_ru : cat.name}
            </button>
          ))}
        </div>

        {/* Sort tabs */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 20,
          overflowX: 'auto',
        }}>
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              className={`tab ${activeSort === opt.key ? 'active' : ''}`}
              onClick={() => setActiveSort(opt.key)}
              style={{ padding: '6px 12px', fontSize: 13, whiteSpace: 'nowrap' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <ProductGridSkeleton />
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: 'var(--text-muted)',
          }}>
            <span style={{ fontSize: 48 }}>🔍</span>
            <p style={{ marginTop: 12 }}>{t('no_products')}</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
