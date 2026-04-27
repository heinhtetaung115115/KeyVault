'use client';
import { useStore } from './StoreContext';

export default function Footer() {
  const { t } = useStore();

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '24px 20px',
      marginTop: 60,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {['about', 'faq', 'terms', 'privacy', 'support'].map(k => (
            <a key={k} href={`#${k}`} style={{
              color: 'var(--text-muted)', textDecoration: 'none',
              fontSize: 13, fontWeight: 500,
              transition: 'color 0.2s',
            }}>{t(k)}</a>
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {t('footer_powered')}
        </span>
      </div>
    </footer>
  );
}
