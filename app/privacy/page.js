'use client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

export default function PrivacyPage() {
  const sectionStyle = { marginBottom: 32 };
  const headingStyle = { fontSize: 18, fontWeight: 600, margin: '0 0 10px', color: 'var(--text-primary)' };
  const textStyle = { color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, margin: '0 0 10px' };

  return (
    <>
      <Header />
      <CartDrawer />
      <Toast />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 60px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← Back to store</a>

        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 8px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: April 2026</p>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>1. Introduction</h2>
          <p style={textStyle}>
            KeyVault ("we," "our," or "us") operates keyvaultstore.com. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>2. Information We Collect</h2>
          <p style={textStyle}>
            We collect minimal information necessary to process your orders and deliver your products. This includes your email address (provided at checkout for order delivery and retrieval), payment transaction identifiers (we do not store card numbers or cryptocurrency wallet addresses), and basic usage data such as pages visited and browser type (collected automatically for analytics and security).
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>3. How We Use Your Information</h2>
          <p style={textStyle}>
            Your email address is used to associate orders with your account for retrieval purposes, and to contact you regarding order issues if necessary. Transaction identifiers are used to verify payment status and resolve disputes. Usage data is used to improve our website performance and security.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>4. Payment Processing</h2>
          <p style={textStyle}>
            Card payments are processed by Stripe, Inc. Cryptocurrency payments are processed by NOWPayments. These third-party processors handle your payment details directly. We never receive, store, or have access to your full card number, CVV, or cryptocurrency private keys. Please refer to Stripe's Privacy Policy (stripe.com/privacy) and NOWPayments' Privacy Policy (nowpayments.io/privacy) for information on how they handle your data.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>5. Data Storage and Security</h2>
          <p style={textStyle}>
            Your order information is stored securely in our database hosted by Supabase. We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>6. Data Sharing</h2>
          <p style={textStyle}>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only with payment processors (Stripe and NOWPayments) as necessary to process your transactions, and with law enforcement if required by law or to protect our rights.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>7. Cookies</h2>
          <p style={textStyle}>
            Our website uses local storage to save your preferences (theme, language) and cart contents. We do not use tracking cookies for advertising purposes. Third-party payment processors may set their own cookies during the checkout process.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>8. Your Rights</h2>
          <p style={textStyle}>
            You have the right to request access to the personal data we hold about you, request deletion of your personal data, and opt out of any marketing communications. To exercise any of these rights, please contact us through our Support page.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>9. Children's Privacy</h2>
          <p style={textStyle}>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>10. Changes to This Policy</h2>
          <p style={textStyle}>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>11. Contact</h2>
          <p style={textStyle}>
            If you have any questions about this Privacy Policy, please contact us through our <a href="/support" style={{ color: 'var(--brand)' }}>Support page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
