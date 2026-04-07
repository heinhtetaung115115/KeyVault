'use client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

export default function TermsPage() {
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

        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 8px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: April 2026</p>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>1. Overview</h2>
          <p style={textStyle}>
            These Terms of Service govern your use of keyvaultstore.com (the "Site") and any purchases made through the Site. By accessing or using the Site, you agree to be bound by these terms. If you do not agree, please do not use the Site.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>2. Products and Services</h2>
          <p style={textStyle}>
            KeyVault sells digital products including but not limited to game activation keys, gift cards, software licenses, and subscription codes. All products are delivered electronically. No physical goods are shipped.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>3. Purchasing and Payment</h2>
          <p style={textStyle}>
            By placing an order, you confirm that you are at least 18 years of age or have the consent of a parent or guardian. All prices are displayed in USD unless otherwise noted. Payment is processed securely through Stripe (for card payments) or NOWPayments (for cryptocurrency). We do not store your payment card details.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>4. Delivery</h2>
          <p style={textStyle}>
            Products marked as "instant delivery" are delivered automatically upon payment confirmation. Products marked as "manual delivery" are delivered by our team within 24 hours. Delivered content is accessible via your unique order page and can be retrieved at any time using the email address provided at checkout.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>5. Refund Policy</h2>
          <p style={textStyle}>
            Due to the digital nature of our products, all sales are generally considered final. However, we will issue a refund or replacement in the following circumstances: the key or code delivered is invalid or has already been redeemed; the product delivered does not match the product description; a technical error on our part prevented delivery. To request a refund, please contact us through our Support page within 7 days of purchase with your order ID and a description of the issue.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>6. Acceptable Use</h2>
          <p style={textStyle}>
            You agree not to use the Site for any unlawful purpose, attempt to gain unauthorized access to our systems, resell products purchased from KeyVault without authorization, or use automated tools to access the Site. We reserve the right to refuse service, cancel orders, or suspend access at our discretion if we suspect fraudulent or abusive activity.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>7. Intellectual Property</h2>
          <p style={textStyle}>
            All content on the Site, including text, graphics, logos, and software, is the property of KeyVault or its content suppliers and is protected by applicable intellectual property laws. Product names, logos, and brands mentioned on the Site are the property of their respective owners.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>8. Limitation of Liability</h2>
          <p style={textStyle}>
            KeyVault is provided on an "as is" basis. We make no warranties, expressed or implied, regarding the availability, accuracy, or reliability of the Site. To the maximum extent permitted by law, KeyVault shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site or products purchased through it.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>9. Changes to Terms</h2>
          <p style={textStyle}>
            We reserve the right to update these Terms of Service at any time. Changes will be posted on this page with an updated revision date. Continued use of the Site after changes constitutes acceptance of the revised terms.
          </p>
        </div>

        <div style={sectionStyle}>
          <h2 style={headingStyle}>10. Contact</h2>
          <p style={textStyle}>
            If you have any questions about these Terms, please contact us through our <a href="/support" style={{ color: 'var(--brand)' }}>Support page</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
