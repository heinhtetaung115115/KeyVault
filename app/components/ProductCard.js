'use client';
import { useStore } from './StoreContext';

export default function ProductCard({ product, onClick }) {
  const { locale, t } = useStore();
  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name;
  const stock = product.stock_count ?? 0;
  const isAuto = product.delivery_type === 'auto';

  return (
    <div className="product-card" onClick={() => onClick?.(product)}>
      {/* Image */}
      <div style={{
        width: '100%',
        aspectRatio: '16/10',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: 40 }}>🎮</span>
        )}
        {/* Delivery badge */}
        <span style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 8px', borderRadius: 6,
          fontSize: 11, fontWeight: 600,
          background: isAuto ? '#dcfce7' : '#fef3c7',
          color: isAuto ? '#166534' : '#92400e',
        }}>
          {isAuto ? '⚡ Auto' : '🕐 Manual'}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <h3 style={{
          fontSize: 14, fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0, marginBottom: 6,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{name}</h3>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        }}>
          <span style={{
            fontSize: 18, fontWeight: 700,
            color: 'var(--brand)',
          }}>
            ${Number(product.price).toFixed(2)}
          </span>

          {isAuto && (
            <span className={`stock-badge ${stock > 5 ? 'in-stock' : stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
              {stock > 0 ? `${stock} ${t('items_left')}` : t('out_of_stock')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
