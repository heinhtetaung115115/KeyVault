'use client';
import { useState } from 'react';
import { useStore } from './StoreContext';

export default function ProductModal({ product, onClose }) {
  const { locale, addToCart, t } = useStore();
  const [activeTab, setActiveTab] = useState('description');
  const [buying, setBuying] = useState(false);
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);

  if (!product) return null;

  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name;
  const desc = locale === 'ru' && product.description_ru ? product.description_ru : product.description;
  const stock = product.stock_count ?? 0;
  const isAuto = product.delivery_type === 'auto';
  const canBuy = isAuto ? stock > 0 : true;

  const handleBuy = async (method) => {
    if (!email) return;
    setBuying(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          email,
          payment_method: method,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) {
      alert('Checkout error');
    }
    setBuying(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        maxWidth: 560, width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--border)',
      }}>
        {/* Image */}
        <div style={{
          width: '100%', aspectRatio: '16/9',
          background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '16px 16px 0 0', overflow: 'hidden',
          position: 'relative',
        }}>
          {product.image_url ? (
            <img src={product.image_url} alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 64 }}>🎮</span>
          )}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Title + Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{name}</h2>
            <span style={{
              fontSize: 24, fontWeight: 700, color: 'var(--brand)',
              flexShrink: 0,
            }}>${Number(product.price).toFixed(2)}</span>
          </div>

          {/* Option chips row: delivery type + stock */}
          <div className="chips-scroll" style={{ marginTop: 12 }}>
            <span className="chip active">
              {isAuto ? `⚡ ${t('auto_delivery')}` : `🕐 ${t('manual_delivery')}`}
            </span>
            {isAuto && (
              <span className={`chip ${stock > 0 ? '' : 'active'}`} style={stock === 0 ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}>
                {stock > 0 ? `📦 ${stock} ${t('items_left')}` : `❌ ${t('out_of_stock')}`}
              </span>
            )}
            {product.category_name && (
              <span className="chip">🏷️ {product.category_name}</span>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 20, marginTop: 20, borderBottom: '1px solid var(--border)' }}>
            <button className={`tab ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}>{t('description')}</button>
            <button className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}>{t('details')}</button>
          </div>

          {/* Tab content */}
          <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, minHeight: 80 }}>
            {activeTab === 'description' && (
              <div>{desc || 'No description available.'}</div>
            )}
            {activeTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('delivery_type')}</span>
                  <span style={{ fontWeight: 600 }}>{isAuto ? t('auto_delivery') : t('manual_delivery')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('category')}</span>
                  <span style={{ fontWeight: 600 }}>{product.category_name || '—'}</span>
                </div>
                {isAuto && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('in_stock')}</span>
                    <span style={{ fontWeight: 600 }}>{stock}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Purchase section */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            {!paymentMethod ? (
              <>
                {/* Email input */}
                <input
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                {/* Payment buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-primary"
                    disabled={!canBuy || !email || buying}
                    onClick={() => handleBuy('stripe')}
                    style={{ flex: 1 }}
                  >
                    💳 {t('pay_with_card')}
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={!canBuy || !email || buying}
                    onClick={() => handleBuy('crypto')}
                    style={{ flex: 1 }}
                  >
                    ₿ {t('pay_with_crypto')}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 12px' }} />
                <p>{t('loading')}</p>
              </div>
            )}

            {/* Add to cart */}
            <button
              className="btn-secondary"
              onClick={() => { addToCart(product); onClose(); }}
              disabled={!canBuy}
              style={{ width: '100%', marginTop: 10 }}
            >
              🛒 {t('add_to_cart')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
