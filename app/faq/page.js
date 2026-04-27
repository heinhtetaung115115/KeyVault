'use client';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

const faqs = [
  {
    q: 'How does instant delivery work?',
    a: 'After your payment is confirmed, your key or code is automatically delivered to your order page. You will also be able to look up your order anytime using the email address you provided at checkout. The entire process typically takes under 30 seconds.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Visa and Mastercard through Stripe (our secure payment processor), as well as various cryptocurrencies including Bitcoin, Ethereum, USDT, and more through NOWPayments.',
  },
  {
    q: 'How do I receive my product after purchase?',
    a: 'After payment, you will be redirected to your unique order page where your key or code will be displayed. You can copy it directly from there. You can also revisit your order at any time by going to the Orders page and entering your email.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. KeyVault does not require account registration. Simply provide your email address at checkout and your orders will be linked to that email for easy retrieval.',
  },
  {
    q: 'What if my key does not work?',
    a: 'If you experience any issues with a key or code you have received, please contact us through our Support page with your order ID and a description of the problem. We will investigate and provide a replacement or refund as appropriate.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Due to the nature of digital products, refunds are handled on a case-by-case basis. If the product delivered is invalid, duplicate, or not as described, we will issue a replacement or refund. Please see our Terms of Service for the full refund policy.',
  },
  {
    q: 'Is it safe to buy from KeyVault?',
    a: 'Yes. All card payments are processed securely through Stripe, a PCI-compliant payment processor. We never store your card details. Cryptocurrency payments are processed through NOWPayments. All products are sourced from authorized distributors.',
  },
  {
    q: 'How long are my keys available after purchase?',
    a: 'Your keys are stored on your order page indefinitely. We recommend copying and saving your keys immediately after purchase for your own records.',
  },
  {
    q: 'What is manual delivery?',
    a: 'Some products are marked as manual delivery. For these items, your content will be delivered by our team within 24 hours of payment confirmation. You will see it appear on your order page once delivered.',
  },
  {
    q: 'Can I buy multiple products at once?',
    a: 'Yes. You can add multiple items to your cart and proceed to checkout. Each product will create a separate order with its own delivery.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'all 0.2s',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-primary)', fontSize: 15, fontWeight: 600,
        textAlign: 'left', gap: 12,
      }}>
        <span>{q}</span>
        <span style={{
          fontSize: 18, flexShrink: 0, transition: 'transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
          color: 'var(--text-muted)',
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 20px 16px',
          color: 'var(--text-secondary)',
          fontSize: 14, lineHeight: 1.7,
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <Header />
      <CartDrawer />
      <Toast />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 60px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← Back to store</a>

        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 8px' }}>Frequently Asked Questions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28 }}>
          Find answers to common questions about purchasing from KeyVault.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, i) => <FaqItem key={i} {...faq} />)}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 32, textAlign: 'center' }}>
          Still have questions? <a href="/support" style={{ color: 'var(--brand)' }}>Contact Support</a>
        </p>
      </main>
      <Footer />
    </>
  );
}
