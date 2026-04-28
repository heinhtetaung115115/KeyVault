'use client';
import { useStore } from './StoreContext';

export default function Footer() {
  const { t } = useStore();
  const links = [
    { key: 'about', href: '/about' },
    { key: 'faq', href: '/faq' },
    { key: 'terms', href: '/terms' },
    { key: 'privacy', href: '/privacy' },
    { key: 'support', href: '/support' },
  ];

  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 20px', marginTop: 60 }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {links.map(l => (
            <a key={l.key} href={l.href} style={{
              color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, fontWeight: 500,
            }}>{t(l.key)}</a>
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('footer_powered')}</span>
      </div>
    </footer>
  );
}
