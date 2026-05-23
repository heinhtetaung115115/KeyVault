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
    } catch(_e) {
      setProducts([]);
    }
    setLoading(false);
  }, [activeCategory, activeSort, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch(_e) {
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
        {/* Hero with animated background */}
        <section className="hero-banner" style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 16, margin: '16px 0 20px',
          padding: '28px 28px',
        }}>
          {/* Animated mesh gradient background */}
          <div className="hero-bg" />

          {/* Animated grid lines */}
          <div className="hero-grid" />

          {/* Floating particles */}
          <div className="hero-particle p1" />
          <div className="hero-particle p2" />
          <div className="hero-particle p3" />
          <div className="hero-particle p4" />
          <div className="hero-particle p5" />
          <div className="hero-particle p6" />

          {/* Aurora wave */}
          <div className="hero-aurora" />
          <div className="hero-aurora a2" />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'white', lineHeight: 1.3, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
                {t('hero_title')}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '6px 0 0', lineHeight: 1.5, maxWidth: 400 }}>
                {t('hero_subtitle')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { icon: '⚡', label: t('badge_instant') },
                { icon: '🛡', label: t('badge_protected') },
                { icon: '✓', label: t('badge_verified') },
                { icon: '💳', label: t('badge_secure') },
              ].map((b, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white', fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <style>{`
          .hero-banner {
            background: #0f0a2e;
          }

          .hero-bg {
            position: absolute; inset: 0;
            background:
              radial-gradient(ellipse 80% 60% at 10% 40%, rgba(99, 102, 241, 0.5) 0%, transparent 60%),
              radial-gradient(ellipse 60% 80% at 80% 20%, rgba(168, 85, 247, 0.4) 0%, transparent 55%),
              radial-gradient(ellipse 70% 50% at 50% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 40% 40% at 90% 70%, rgba(236, 72, 153, 0.25) 0%, transparent 50%);
            animation: meshMove 8s ease-in-out infinite alternate;
          }

          @keyframes meshMove {
            0% { transform: scale(1) translate(0, 0); }
            33% { transform: scale(1.05) translate(-2%, 1%); }
            66% { transform: scale(1.02) translate(1%, -1%); }
            100% { transform: scale(1) translate(-1%, 2%); }
          }

          .hero-grid {
            position: absolute; inset: 0;
            background-image:
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 40px 40px;
            animation: gridScroll 20s linear infinite;
          }

          @keyframes gridScroll {
            0% { transform: translate(0, 0); }
            100% { transform: translate(40px, 40px); }
          }

          .hero-particle {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
          }
          .p1 { width: 4px; height: 4px; background: rgba(167,139,250,0.7); top: 20%; left: 15%; animation: drift 7s ease-in-out infinite; }
          .p2 { width: 3px; height: 3px; background: rgba(129,140,248,0.6); top: 60%; left: 75%; animation: drift 9s ease-in-out infinite reverse; }
          .p3 { width: 5px; height: 5px; background: rgba(236,72,153,0.5); top: 30%; left: 85%; animation: drift 6s ease-in-out infinite; }
          .p4 { width: 3px; height: 3px; background: rgba(59,130,246,0.6); top: 70%; left: 25%; animation: drift 8s ease-in-out infinite reverse; }
          .p5 { width: 6px; height: 6px; background: rgba(167,139,250,0.4); top: 45%; left: 55%; animation: drift 10s ease-in-out infinite; }
          .p6 { width: 4px; height: 4px; background: rgba(99,102,241,0.5); top: 15%; left: 45%; animation: drift 7.5s ease-in-out infinite reverse; }

          @keyframes drift {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
            25% { transform: translate(15px, -20px) scale(1.3); opacity: 1; }
            50% { transform: translate(-10px, -35px) scale(0.8); opacity: 0.4; }
            75% { transform: translate(20px, -15px) scale(1.2); opacity: 0.9; }
          }

          .hero-aurora {
            position: absolute;
            bottom: -30%; left: -10%;
            width: 120%; height: 60%;
            background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.15) 20%, rgba(168,85,247,0.12) 40%, rgba(236,72,153,0.1) 60%, rgba(59,130,246,0.12) 80%, transparent 100%);
            filter: blur(30px);
            animation: aurora 6s ease-in-out infinite alternate;
            pointer-events: none;
          }
          .hero-aurora.a2 {
            top: -40%; bottom: auto; left: 0;
            animation: aurora 8s ease-in-out infinite alternate-reverse;
            opacity: 0.6;
          }

          @keyframes aurora {
            0% { transform: translateX(-5%) scaleY(1); opacity: 0.5; }
            50% { transform: translateX(3%) scaleY(1.2); opacity: 0.8; }
            100% { transform: translateX(-3%) scaleY(0.9); opacity: 0.6; }
          }
        `}</style>

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
