'use client';
import { useState } from 'react';
import { useStore } from '../components/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import CartDrawer from '../components/CartDrawer';

export default function OrdersPage() {
  const { t, locale } = useStore();
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  const statusStyles = {
    pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
    paid: { bg: '#e0e7ff', color: '#3730a3', label: '✅ Paid' },
    delivered: { bg: '#dcfce7', color: '#166534', label: '🎉 Delivered' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled' },
    refunded: { bg: '#f0e6ff', color: '#5b21b6', label: '↩️ Refunded' },
  };

  return (
    <>
      <Header />
      <CartDrawer />
      <Toast />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          📋 {t('order_lookup')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          {t('order_lookup_desc')}
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            type="email"
            placeholder={t('email_placeholder')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
            {loading ? '...' : t('find_orders')}
          </button>
        </form>

        {/* Results */}
        {orders !== null && (
          orders.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 0',
              color: 'var(--text-muted)',
            }}>
              <span style={{ fontSize: 40 }}>📭</span>
              <p style={{ marginTop: 8 }}>No orders found for this email</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => {
                const st = statusStyles[order.status] || statusStyles.pending;
                const productName = locale === 'ru' && order.products?.name_ru
                  ? order.products.name_ru : order.products?.name || 'Unknown product';

                return (
                  <a
                    key={order.id}
                    href={`/order/${order.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: 16, borderRadius: 12,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {order.products?.image_url ? (
                        <img src={order.products.image_url} alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>🎮</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{productName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(order.created_at).toLocaleDateString()} · ${Number(order.amount).toFixed(2)}
                      </div>
                    </div>

                    <span style={{
                      padding: '4px 10px', borderRadius: 6,
                      fontSize: 12, fontWeight: 600,
                      background: st.bg, color: st.color,
                      flexShrink: 0,
                    }}>{st.label}</span>

                    <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>
                  </a>
                );
              })}
            </div>
          )
        )}
      </main>

      <Footer />
    </>
  );
}
