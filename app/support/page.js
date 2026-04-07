'use client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

export default function SupportPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <Toast />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 60px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← Back to store</a>

        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 8px' }}>Support</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Need help with an order or have a question? We are here to help. Please review the options below.
        </p>

        {/* Quick links */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 40,
        }}>
          <a href="/orders" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, textDecoration: 'none', color: 'inherit',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 28 }}>📋</span>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px' }}>Check Order Status</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
              Look up your orders using your email address.
            </p>
          </a>

          <a href="/faq" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 20, textDecoration: 'none', color: 'inherit',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 28 }}>❓</span>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px' }}>FAQ</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
              Find answers to frequently asked questions.
            </p>
          </a>
        </div>

        {/* Contact section */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 28,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px' }}>Contact Us</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            If you cannot find the answer to your question in our FAQ, or if you are experiencing an issue with an order, please reach out to us using the information below. Include your order ID in your message for faster resolution.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-secondary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 18,
                flexShrink: 0,
              }}>📧</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>support@keyvaultstore.com</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-secondary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 18,
                flexShrink: 0,
              }}>🕐</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Response Time</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>Within 24 hours</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-secondary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 18,
                flexShrink: 0,
              }}>🌐</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Website</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>keyvaultstore.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div style={{
          marginTop: 28, padding: 20,
          background: 'var(--brand-light)',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Tips for faster support</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Include your order ID (found on your order page or in your email). Describe the issue clearly — for example, "key shows as already redeemed" or "did not receive delivery." Attach a screenshot if applicable.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
