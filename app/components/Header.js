'use client';
import { useState } from 'react';
import { useStore } from './StoreContext';

export default function Header({ onSearch }) {
  const { theme, toggleTheme, locale, toggleLocale, cart, setCartOpen, t } = useStore();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    onSearch?.(val);
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', color: 'var(--text-primary)',
          fontWeight: 700, fontSize: 20, flexShrink: 0,
        }}>
          <span style={{
            background: 'var(--brand)', color: 'white',
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
          }}>K</span>
          KeyVault
        </a>

        <div style={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
          <input type="search" placeholder={t('search_placeholder')} value={search} onChange={handleSearch}
            style={{ width: '100%' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <a href="/orders" style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            color: 'var(--text-secondary)', textDecoration: 'none',
            border: '1px solid var(--border)',
          }}>{t('orders')}</a>

          <button onClick={toggleLocale} style={{
            padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>{locale === 'en' ? '🇬🇧EN' : '🇷🇺RU'}</button>

          <span style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}>$ USD</span>

          <button onClick={toggleTheme} style={{
            width: 36, height: 36, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16,
          }}>{theme === 'dark' ? '☀️' : '🌙'}</button>

          <button onClick={() => setCartOpen(true)} style={{
            position: 'relative', width: 36, height: 36, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: cart.length > 0 ? 'var(--brand)' : 'var(--bg-secondary)',
            border: cart.length > 0 ? 'none' : '1px solid var(--border)',
            color: cart.length > 0 ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 16,
          }}>
            🛒
            {cart.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--danger)', color: 'white',
                fontSize: 10, fontWeight: 700, width: 18, height: 18,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cart.length}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
