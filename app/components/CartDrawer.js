'use client';
import { useState } from 'react';
import { useStore } from './StoreContext';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, clearCart, cartTotal, locale, t } = useStore();
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [emailError, setEmailError] = useState('');

  if (!cartOpen) return null;

  const handleCheckout = async (method) => {
    if (!email || !email.includes('@')) {
      setEmailError(t('email_required'));
      return;
    }
    setEmailError('');
    setChecking(true);
    try {
      for (const item of cart) {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: item.id, email, payment_method: method }),
        });
        const data = await res.json();
        if (data.url) window.open(data.url, '_blank');
      }
      clearCart();
      setCartOpen(false);
    } catch(_e) {
      alert('Checkout error');
    }
    setChecking(false);
  };

  return (
    <>
      <div onClick={() => setCartOpen(false)} style={{
        position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.4)',
      }} />
      <div className="drawer-enter" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 380, maxWidth: '100vw', zIndex: 91,
        background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🛒 {t('cart')}</h3>
          <button onClick={() => setCartOpen(false)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)',
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>{t('empty_cart')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map(item => {
                const name = locale === 'ru' && item.name_ru ? item.name_ru : item.name;
                return (
                  <div key={item.id} style={{
                    display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 10,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 8, background: 'var(--bg-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : <span>🎮</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)', marginTop: 2 }}>${Number(item.price).toFixed(2)}</div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16,
                    }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
              <span>{t('total')}</span>
              <span style={{ color: 'var(--brand)' }}>${cartTotal.toFixed(2)}</span>
            </div>
            <input type="email" placeholder={t('email_placeholder')} value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              style={{ borderColor: emailError ? 'var(--danger)' : undefined }} />
            {emailError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{emailError}</p>}
            <button className="btn-primary" disabled={checking} onClick={() => handleCheckout('stripe')}>
              💳 {t('pay_with_card')}
            </button>
            <button className="btn-secondary" disabled={checking} onClick={() => handleCheckout('crypto')}>
              ₿ {t('pay_with_crypto')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
