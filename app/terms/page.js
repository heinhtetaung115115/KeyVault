'use client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

export default function TermsPage() {
  const h = { fontSize: 18, fontWeight: 600, margin: '0 0 10px', color: 'var(--text-primary)' };
  const p = { color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14, margin: '0 0 10px' };
  const sec = { marginBottom: 32 };
  return (
    <><Header /><CartDrawer /><Toast />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 60px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← Back to store</a>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 8px' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: April 2026</p>
        <div style={sec}><h2 style={h}>1. Overview</h2><p style={p}>These Terms of Service govern your use of keyvaultstore.com (the &quot;Site&quot;) and any purchases made through the Site. By accessing or using the Site, you agree to be bound by these terms.</p></div>
        <div style={sec}><h2 style={h}>2. Products and Services</h2><p style={p}>KeyVault sells digital products including but not limited to game activation keys, gift cards, software licenses, and subscription codes. All products are delivered electronically. No physical goods are shipped.</p></div>
        <div style={sec}><h2 style={h}>3. Purchasing and Payment</h2><p style={p}>By placing an order, you confirm that you are at least 18 years of age or have the consent of a parent or guardian. All prices are displayed in USD. Payment is processed securely through Stripe (for card payments) or NOWPayments (for cryptocurrency). We do not store your payment card details.</p></div>
        <div style={sec}><h2 style={h}>4. Delivery</h2><p style={p}>Products marked as &quot;instant delivery&quot; are delivered automatically upon payment confirmation. Products marked as &quot;manual delivery&quot; are delivered by our team within 24 hours. Delivered content is accessible via your unique order page and can be retrieved at any time using the email address provided at checkout.</p></div>
        <div style={sec}><h2 style={h}>5. Refund Policy</h2><p style={p}>Due to the digital nature of our products, all sales are generally considered final. However, we will issue a refund or replacement if the key or code delivered is invalid or has already been redeemed, the product delivered does not match the description, or a technical error on our part prevented delivery. To request a refund, contact us through our Support page within 7 days of purchase.</p></div>
        <div style={sec}><h2 style={h}>6. Acceptable Use</h2><p style={p}>You agree not to use the Site for any unlawful purpose, attempt to gain unauthorized access to our systems, resell products without authorization, or use automated tools to access the Site. We reserve the right to refuse service or cancel orders at our discretion.</p></div>
        <div style={sec}><h2 style={h}>7. Intellectual Property</h2><p style={p}>All content on the Site is the property of KeyVault or its content suppliers. Product names, logos, and brands are the property of their respective owners.</p></div>
        <div style={sec}><h2 style={h}>8. Limitation of Liability</h2><p style={p}>KeyVault is provided on an &quot;as is&quot; basis. To the maximum extent permitted by law, KeyVault shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site.</p></div>
        <div style={sec}><h2 style={h}>9. Changes to Terms</h2><p style={p}>We reserve the right to update these Terms at any time. Changes will be posted on this page with an updated date. Continued use constitutes acceptance of the revised terms.</p></div>
        <div style={sec}><h2 style={h}>10. Contact</h2><p style={p}>Questions about these Terms? Contact us through our <a href="/support" style={{ color: 'var(--brand)' }}>Support page</a>.</p></div>
      </main>
      <Footer />
    </>
  );
}
