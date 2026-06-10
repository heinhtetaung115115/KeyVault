'use client';
import { useState, useEffect } from 'react';
import { useStore } from './StoreContext';

export default function Header({ onSearch }) {
  const { theme, toggleTheme, locale, toggleLocale, cart, setCartOpen, t } = useStore();
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    onSearch?.(val);
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'var(--bg-primary)' : 'transparent',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: scrolled ? '8px 20px' : '10px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'padding 0.3s ease',
      }}>
        {/* Logo */}
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', color: 'var(--text-primary)',
          fontWeight: 700, fontSize: scrolled ? 17 : 18,
          flexShrink: 0, transition: 'font-size 0.3s ease',
        }}>
          <img
            src="/logo.svg"
            alt="KeyVault"
            style={{
              width: scrolled ? 28 : 32, height: scrolled ? 28 : 32,
              borderRadius: 8,
              transition: 'all 0.3s ease',
            }}
          />
          KeyVault
        </a>

        {/* Search - wider and taller */}
        <div style={{
          flex: 1, maxWidth: searchFocused ? 600 : 480,
          transition: 'max-width 0.3s ease',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--text-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%',
              background: 'var(--bg-secondary)',
              border: `1px solid ${searchFocused ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 24,
              padding: '10px 44px 10px 40px',
              fontSize: 14,
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
          />
          {search && (
            <button
              onMouseDown={(e) => { e.preventDefault(); setSearch(''); onSearch?.(''); }}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-hover)', border: 'none',
                color: 'var(--text-muted)', fontSize: 14,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >✕</button>
          )}
        </div>

        {/* Right controls - icon-based */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          {/* Account */}
          <a href="/account" title={locale === 'ru' ? 'Аккаунт' : 'My Account'} style={{
            width: 34, height: 34, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', fontSize: 16,
            textDecoration: 'none', transition: 'all 0.2s',
          }}>👤</a>

          {/* Language */}
          <button onClick={toggleLocale} title={locale === 'en' ? 'Switch to Russian' : 'Switch to English'} style={{
            width: 34, height: 34, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {locale === 'en' ? 'EN' : 'RU'}
          </button>

          {/* Theme */}
          <button onClick={toggleTheme} title="Toggle theme" style={{
            width: 34, height: 34, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', fontSize: 15,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Cart */}
          <button onClick={() => setCartOpen(true)} title="Cart" style={{
            position: 'relative',
            width: 34, height: 34, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: cart.length > 0 ? 'var(--brand)' : 'transparent',
            border: 'none',
            color: cart.length > 0 ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 15, transition: 'all 0.2s',
          }}>
            🛒
            {cart.length > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                background: 'var(--danger)', color: 'white',
                fontSize: 9, fontWeight: 700, width: 16, height: 16,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cart.length}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
