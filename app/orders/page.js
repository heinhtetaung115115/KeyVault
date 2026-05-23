'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '../components/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import CartDrawer from '../components/CartDrawer';

export default function OrdersPage() {
  const { t, locale } = useStore();
  // Steps: 'email' -> 'otp' -> 'orders'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState(null);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(locale === 'ru' ? 'Введите корректный email' : 'Please enter a valid email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(locale === 'ru'
          ? `Подождите ${data.retry_after} сек. перед повторной отправкой`
          : `Please wait ${data.retry_after}s before requesting another code`);
        setCountdown(data.retry_after || 60);
      } else if (data.sent) {
        setStep('otp');
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        // Focus first input after render
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (_e) {
      setError('Connection error');
    }
    setLoading(false);
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      // Auto-submit if all filled
      if (newOtp.every(d => d !== '')) {
        setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && newOtp.every(d => d !== '')) {
      setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeOverride) => {
    const code = codeOverride || otp.join('');
    if (code.length !== 6) {
      setError(locale === 'ru' ? 'Введите 6-значный код' : 'Enter the 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.verified && data.token) {
        setToken(data.token);
        // Fetch orders with token
        await fetchOrders(data.token);
        setStep('orders');
      } else {
        setError(data.error || (locale === 'ru' ? 'Неверный код' : 'Invalid code'));
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (_e) {
      setError('Verification failed');
    }
    setLoading(false);
  };

  // Fetch orders with token
  const fetchOrders = async (t) => {
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}&token=${encodeURIComponent(t)}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (_e) {
      setOrders([]);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.sent) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (_e) { /* ignore */ }
    setLoading(false);
  };

  const statusStyles = {
    pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
    paid: { bg: '#e0e7ff', color: '#3730a3', label: '✅ Paid' },
    delivered: { bg: '#dcfce7', color: '#166534', label: '🎉 Delivered' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled' },
    refunded: { bg: '#f0e6ff', color: '#5b21b6', label: '↩️ Refunded' },
  };

  return (
    <>
      <Header />
      <CartDrawer />
      <Toast />

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px' }}>

        {/* ===== STEP 1: Email ===== */}
        {step === 'email' && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48 }}>📋</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 8px' }}>
              {t('order_lookup')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
              {locale === 'ru'
                ? 'Введите email, указанный при покупке. Мы отправим код подтверждения.'
                : 'Enter the email you used at checkout. We\'ll send a verification code.'}
            </p>

            <form onSubmit={handleSendOtp}>
              <input
                type="email"
                placeholder={t('email_placeholder')}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
                style={{
                  marginBottom: 12, textAlign: 'center', fontSize: 16,
                  borderColor: error ? 'var(--danger)' : undefined,
                }}
              />
              {error && (
                <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
              )}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading
                  ? (locale === 'ru' ? 'Отправка...' : 'Sending...')
                  : (locale === 'ru' ? 'Отправить код' : 'Send verification code')}
              </button>
            </form>
          </div>
        )}

        {/* ===== STEP 2: OTP Input ===== */}
        {step === 'otp' && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48 }}>✉️</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 8px' }}>
              {locale === 'ru' ? 'Введите код' : 'Enter verification code'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              {locale === 'ru'
                ? `Мы отправили 6-значный код на`
                : `We sent a 6-digit code to`}
            </p>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 28 }}>{email}</p>

            {/* OTP Boxes */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 8,
              marginBottom: 16,
            }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  style={{
                    width: 48, height: 56,
                    textAlign: 'center',
                    fontSize: 22, fontWeight: 700,
                    borderRadius: 10,
                    border: `2px solid ${error ? 'var(--danger)' : digit ? 'var(--brand)' : 'var(--border)'}`,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    caretColor: 'var(--brand)',
                  }}
                />
              ))}
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <button
              className="btn-primary"
              disabled={loading || otp.some(d => !d)}
              onClick={() => handleVerifyOtp()}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {loading
                ? (locale === 'ru' ? 'Проверка...' : 'Verifying...')
                : (locale === 'ru' ? 'Подтвердить' : 'Verify')}
            </button>

            {/* Resend / Back */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button
                onClick={() => { setStep('email'); setError(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 13,
                }}
              >
                ← {locale === 'ru' ? 'Сменить email' : 'Change email'}
              </button>
              <button
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                style={{
                  background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer',
                  color: countdown > 0 ? 'var(--text-muted)' : 'var(--brand)',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                {countdown > 0
                  ? `${locale === 'ru' ? 'Повторить через' : 'Resend in'} ${countdown}s`
                  : (locale === 'ru' ? 'Отправить снова' : 'Resend code')}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Orders List ===== */}
        {step === 'orders' && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 20,
            }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                  {locale === 'ru' ? 'Ваши заказы' : 'Your Orders'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>{email}</p>
              </div>
              <button
                onClick={() => { setStep('email'); setOrders(null); setToken(null); setEmail(''); setOtp(['','','','','','']); }}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: 13 }}
              >
                {locale === 'ru' ? 'Выйти' : 'Logout'}
              </button>
            </div>

            {orders === null || orders.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 0',
                color: 'var(--text-muted)',
              }}>
                <span style={{ fontSize: 40 }}>📭</span>
                <p style={{ marginTop: 8 }}>
                  {locale === 'ru' ? 'Заказы не найдены' : 'No orders found for this email'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(order => {
                  const st = statusStyles[order.status] || statusStyles.pending;
                  const productName = locale === 'ru' && order.products?.name_ru
                    ? order.products.name_ru : order.products?.name || 'Unknown product';

                  return (
                    <a
                      key={order.id}
                      href={`/order/${order.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: 16, borderRadius: 12,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        textDecoration: 'none',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: 8,
                        background: 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {order.products?.image_url ? (
                          <img src={order.products.image_url} alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>🎮</span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{productName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(order.created_at).toLocaleDateString()} · ${Number(order.amount).toFixed(2)}
                        </div>
                      </div>

                      <span style={{
                        padding: '4px 10px', borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                        background: st.bg, color: st.color,
                        flexShrink: 0,
                      }}>{st.label}</span>

                      <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
