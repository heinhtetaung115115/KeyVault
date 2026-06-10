'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '../../components/StoreContext';
import Header from '../../components/Header';
import CartDrawer from '../../components/CartDrawer';
import Toast from '../../components/Toast';
import Footer from '../../components/Footer';

export default function ProductPage() {
  const params = useParams();
  const { locale, addToCart, t } = useStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [email, setEmail] = useState('');
  const [buying, setBuying] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userInputs, setUserInputs] = useState({});
  const [inputErrors, setInputErrors] = useState({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/product?id=${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          // Auto-select first plan if plans exist
          if (data.plans && data.plans.length > 0) {
            setSelectedPlan(data.plans[0]);
          }
        }
      } catch(_e) { /* ignore */ }
      setLoading(false);
    };
    fetchProduct();
  }, [params.id]);

  const handleBuy = async (method) => {
    if (!email || !email.includes('@')) {
      setEmailError(locale === 'ru' ? 'Введите email для получения товара' : 'Please enter your email to receive the product');
      return;
    }
    // Validate required user inputs
    const errors = {};
    (product.user_inputs || []).forEach(inp => {
      if (inp.required && (!userInputs[inp.label] || !userInputs[inp.label].trim())) {
        errors[inp.label] = locale === 'ru' ? 'Обязательное поле' : 'Required';
      }
    });
    if (Object.keys(errors).length > 0) {
      setInputErrors(errors);
      return;
    }
    setEmailError('');
    setInputErrors({});
    setBuying(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          email,
          payment_method: method,
          plan_id: selectedPlan?.id || null,
          user_input_data: Object.keys(userInputs).length > 0 ? userInputs : null,
        }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert(data.error || 'Checkout failed'); }
    } catch(_e) { alert('Checkout error'); }
    setBuying(false);
  };

  const displayPrice = selectedPlan ? selectedPlan.price : product?.price;

  if (loading) {
    return (<><Header /><CartDrawer />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div className="skeleton" style={{ aspectRatio: '16/10', borderRadius: 12 }} />
          <div><div className="skeleton" style={{ height: 28, width: '70%', marginBottom: 16 }} /><div className="skeleton" style={{ height: 36, width: '30%', marginBottom: 24 }} /><div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 8 }} /><div className="skeleton" style={{ height: 14, width: '60%' }} /></div>
        </div>
      </main></>);
  }

  if (!product) {
    return (<><Header /><CartDrawer />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 56 }}>🔍</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 12 }}>Product not found</h2>
        <a href="/" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex', textDecoration: 'none' }}>{t('back_to_store')}</a>
      </main></>);
  }

  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name;
  const desc = locale === 'ru' && product.description_ru ? product.description_ru : product.description;
  const stock = product.stock_count ?? 0;
  const isAuto = product.delivery_type === 'auto';
  const canBuy = isAuto ? stock > 0 : true;
  const plans = product.plans || [];
  const inputs = product.user_inputs || [];

  return (
    <><Header /><CartDrawer /><Toast />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500, marginBottom: 20 }}>{t('back_to_store')}</a>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 36, alignItems: 'start' }}>
          {/* Left: Image + Plans */}
          <div>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {product.image_url ? <img src={product.image_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 80 }}>🎮</span>}
            </div>

            {/* Plan selection below image */}
            {plans.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {locale === 'ru' ? 'Выберите план' : 'Select Plan'} ({plans.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                  {plans.map(plan => {
                    const isSelected = selectedPlan?.id === plan.id;
                    const planLabel = locale === 'ru' && plan.name_ru ? plan.name_ru : plan.name;
                    return (
                      <button key={plan.id} onClick={() => setSelectedPlan(plan)} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '9px 14px', borderRadius: 8,
                        background: isSelected ? 'var(--brand-light)' : 'var(--bg-card)',
                        border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                        color: 'var(--text-primary)', flexShrink: 0,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${isSelected ? 'var(--brand)' : 'var(--border)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{planLabel}</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', flexShrink: 0, marginLeft: 8 }}>${Number(plan.price).toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{name}</h1>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand)', margin: '12px 0 16px' }}>
              ${Number(displayPrice).toFixed(2)}
            </div>

            {/* Chips */}
            <div className="chips-scroll" style={{ marginBottom: 16 }}>
              <span className="chip active">{isAuto ? `⚡ ${t('auto_delivery')}` : `🕐 ${product.delivery_time || t('manual_delivery')}`}</span>
              {isAuto && <span className={`chip ${stock === 0 ? 'active' : ''}`} style={stock === 0 ? { background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' } : {}}>{stock > 0 ? `✓ ${t('in_stock')}` : `❌ ${t('out_of_stock')}`}</span>}
              {product.category_name && <span className="chip">🏷️ {locale === 'ru' && product.category_name_ru ? product.category_name_ru : product.category_name}</span>}
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <span className="trust-badge">⚡ {t('badge_instant')}</span>
              <span className="trust-badge">🛡 {t('badge_protected')}</span>
              <span className="trust-badge">💳 {t('badge_secure')}</span>
            </div>

            {/* Purchase box */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              {/* User input fields */}
              {inputs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {inputs.map((inp, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {locale === 'ru' && inp.label_ru ? inp.label_ru : inp.label}
                        {inp.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={inp.placeholder || ''}
                        value={userInputs[inp.label] || ''}
                        onChange={e => { setUserInputs(prev => ({ ...prev, [inp.label]: e.target.value })); setInputErrors(prev => ({ ...prev, [inp.label]: '' })); }}
                        style={{ borderColor: inputErrors[inp.label] ? 'var(--danger)' : undefined }}
                      />
                      {inputErrors[inp.label] && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>{inputErrors[inp.label]}</p>}
                    </div>
                  ))}
                </div>
              )}

              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {locale === 'ru' ? 'Email для доставки' : 'Email for delivery'}
              </label>
              <input type="email" placeholder={t('email_placeholder')} value={email}
                onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                style={{ marginBottom: emailError ? 4 : 12, borderColor: emailError ? 'var(--danger)' : undefined }} />
              {emailError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '0 0 10px', fontWeight: 500 }}>{emailError}</p>}

              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <button className="btn-primary" disabled={!canBuy || buying} onClick={() => handleBuy('stripe')} style={{ flex: 1 }}>💳 {t('pay_with_card')}</button>
                <button className="btn-secondary" disabled={!canBuy || buying} onClick={() => handleBuy('crypto')} style={{ flex: 1 }}>₿ {t('pay_with_crypto')}</button>
              </div>
              <button className="btn-secondary" onClick={() => addToCart({ ...product, price: displayPrice, selectedPlan })} disabled={!canBuy} style={{ width: '100%' }}>🛒 {t('add_to_cart')}</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
            {['description', 'details'].map(tabKey => (
              <button key={tabKey} className={`tab ${activeTab === tabKey ? 'active' : ''}`} onClick={() => setActiveTab(tabKey)}
                style={{ padding: '14px 24px', fontSize: 14, borderBottom: activeTab === tabKey ? '2px solid var(--brand)' : '2px solid transparent' }}>{t(tabKey)}</button>
            ))}
          </div>
          <div style={{ padding: 24, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, minHeight: 120 }}>
            {activeTab === 'description' && <div style={{ whiteSpace: 'pre-wrap' }}>{desc || 'No description available.'}</div>}
            {activeTab === 'details' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', maxWidth: 400 }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('delivery_type')}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{isAuto ? t('auto_delivery') : (product.delivery_time || t('manual_delivery'))}</span>
                <span style={{ color: 'var(--text-muted)' }}>{t('category')}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.category_name || '—'}</span>
                {isAuto && (<><span style={{ color: 'var(--text-muted)' }}>{t('in_stock')}</span><span style={{ fontWeight: 600, color: stock > 0 ? 'var(--success)' : 'var(--danger)' }}>{stock > 0 ? '✓' : '✕'}</span></>)}
                {plans.length > 0 && (<><span style={{ color: 'var(--text-muted)' }}>Plans</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{plans.length} options</span></>)}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <style>{`@media (max-width: 700px) { main > div:nth-child(2) { grid-template-columns: 1fr !important; gap: 20px !important; } }`}</style>
    </>
  );
}
