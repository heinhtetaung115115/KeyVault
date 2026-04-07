'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '../../components/StoreContext';

export default function OrderPage() {
  const params = useParams();
  const { t, locale } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?id=${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);

          // If still pending, poll every 5s for up to 2 minutes
          if (data.status === 'pending' && pollCount < 24) {
            setTimeout(() => setPollCount(c => c + 1), 5000);
          }
        }
      } catch {}
      setLoading(false);
    };
    fetchOrder();
  }, [params.id, pollCount]);

  const copyContent = () => {
    if (order?.delivered_content) {
      navigator.clipboard.writeText(order.delivered_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>❌</span>
          <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Order not found</p>
          <a href="/" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex', textDecoration: 'none' }}>
            {t('back_to_store')}
          </a>
        </div>
      </div>
    );
  }

  const productName = locale === 'ru' && order.products?.name_ru
    ? order.products.name_ru : order.products?.name;

  const statusConfig = {
    pending: { icon: '⏳', color: '#f59e0b', label: t('payment_processing') },
    paid: { icon: '✅', color: '#22c55e', label: order.delivery_type === 'manual' ? t('manual_delivery_note') : t('order_pending') },
    delivered: { icon: '🎉', color: '#22c55e', label: t('order_complete') },
    cancelled: { icon: '❌', color: '#ef4444', label: 'Cancelled' },
    refunded: { icon: '↩️', color: '#6366f1', label: 'Refunded' },
  };
  const st = statusConfig[order.status] || statusConfig.pending;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16, maxWidth: 520, width: '100%',
        overflow: 'hidden',
      }}>
        {/* Product image */}
        <div style={{
          width: '100%', height: 160,
          background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {order.products?.image_url ? (
            <img src={order.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 48 }}>🎮</span>
          )}
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Status */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 48 }}>{st.icon}</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px' }}>{st.label}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{productName}</p>
          </div>

          {/* Order details */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 10, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 10,
            fontSize: 14,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('order_id')}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.id.slice(0, 8)}...</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('order_date')}</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('total')}</span>
              <span style={{ fontWeight: 700, color: 'var(--brand)' }}>${Number(order.amount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('delivery_type')}</span>
              <span>{order.delivery_type === 'auto' ? t('auto_delivery') : t('manual_delivery')}</span>
            </div>
          </div>

          {/* Delivered content */}
          {order.status === 'delivered' && order.delivered_content && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                🔑 {t('your_keys')}
              </h3>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: 16,
                position: 'relative',
              }}>
                <pre style={{
                  margin: 0, fontSize: 14,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)',
                }}>
                  {order.delivered_content}
                </pre>
                <button
                  onClick={copyContent}
                  className="btn-secondary"
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    padding: '4px 12px', fontSize: 12,
                  }}
                >
                  {copied ? `✓ ${t('copied')}` : `📋 ${t('copy')}`}
                </button>
              </div>
            </div>
          )}

          {/* Awaiting manual delivery */}
          {order.status === 'paid' && order.delivery_type === 'manual' && (
            <div style={{
              marginTop: 20, padding: 16,
              background: '#fef3c7', borderRadius: 10,
              color: '#92400e', fontSize: 14,
              textAlign: 'center',
            }}>
              🕐 {t('awaiting_delivery')}
            </div>
          )}

          {/* Pending payment */}
          {order.status === 'pending' && (
            <div style={{
              marginTop: 20, padding: 16,
              background: 'var(--bg-secondary)', borderRadius: 10,
              color: 'var(--text-muted)', fontSize: 14,
              textAlign: 'center',
            }}>
              ⏳ {t('payment_processing')}
              <div className="skeleton" style={{ height: 4, marginTop: 12, borderRadius: 2 }} />
            </div>
          )}

          {/* Back link */}
          <a href="/" style={{
            display: 'block', textAlign: 'center',
            marginTop: 24, color: 'var(--brand)',
            textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>
            {t('back_to_store')}
          </a>
        </div>
      </div>
    </div>
  );
}
