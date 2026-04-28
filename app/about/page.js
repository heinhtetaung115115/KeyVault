'use client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

export default function AboutPage() {
  return (
    <><Header /><CartDrawer /><Toast />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 60px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← Back to store</a>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 8px' }}>About KeyVault</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>KeyVault is a trusted online marketplace for digital products including game keys, gift cards, software licenses, and subscriptions. We are committed to providing our customers with genuine products at competitive prices, backed by instant automated delivery.</p>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: '32px 0 12px' }}>Our Mission</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>We believe purchasing digital goods should be fast, simple, and secure. Our platform eliminates unnecessary complexity — find your product, pay with your preferred method, and receive your key or code instantly. No accounts required, no waiting.</p>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: '32px 0 12px' }}>Why Choose Us</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
          {[{ icon: '⚡', title: 'Instant Delivery', desc: 'Keys and codes delivered automatically within seconds of payment confirmation.' },
            { icon: '🛡', title: 'Buyer Protection', desc: 'Every purchase is covered by our buyer protection policy. If there is an issue, we will resolve it.' },
            { icon: '💳', title: 'Secure Payments', desc: 'We accept Visa, Mastercard via Stripe, and cryptocurrency. All transactions are encrypted and secure.' },
            { icon: '✓', title: 'Verified Products', desc: 'All products are sourced from authorized distributors and verified before listing.' }
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: '32px 0 12px' }}>Contact</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>Have questions or need help? Visit our <a href="/support" style={{ color: 'var(--brand)' }}>Support page</a> to get in touch. We typically respond within 24 hours.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>Website: keyvaultstore.com</p>
      </main>
      <Footer />
    </>
  );
}
