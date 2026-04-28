'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../components/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import CartDrawer from '../components/CartDrawer';

const SESSION_KEY = 'kv-session';
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours

function saveSession(email, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, token, expires: Date.now() + SESSION_TTL }));
}
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.expires) { localStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch(_e) { return null; }
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

// Time formatter
function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function AccountPage() {
  const { t, locale, showToast } = useStore();
  const [step, setStep] = useState('loading');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newOrderId, setNewOrderId] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Restore session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setEmail(session.email);
      setToken(session.token);
      setStep('account');
    } else {
      setStep('email');
    }
  }, []);

  // Load data when account step reached
  useEffect(() => {
    if (step === 'account' && token) {
      fetchOrders(token);
      fetchConversations();
    }
  }, [step, token]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!activeConv || step !== 'account') return;
    const interval = setInterval(() => loadMessages(activeConv.id), 6000);
    return () => clearInterval(interval);
  }, [activeConv, step]);

  // ===== OTP =====
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setError(locale === 'ru' ? 'Введите корректный email' : 'Please enter a valid email'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.status === 429) { setError(`${locale === 'ru' ? 'Подождите' : 'Wait'} ${data.retry_after}s`); setCountdown(data.retry_after || 60); }
      else if (data.sent) { setStep('otp'); setCountdown(60); setOtp(['','','','','','']); setTimeout(() => inputRefs.current[0]?.focus(), 100); }
      else setError(data.error || 'Failed');
    } catch(_e) { setError('Connection error'); }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp]; digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; }); setOtp(newOtp);
      inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
      if (newOtp.every(d => d !== '')) setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
      return;
    }
    const digit = value.replace(/\D/g, ''); const newOtp = [...otp]; newOtp[index] = digit; setOtp(newOtp);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && newOtp.every(d => d !== '')) setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
  };

  const handleOtpKeyDown = (index, e) => { if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus(); };

  const handleVerifyOtp = async (codeOverride) => {
    const code = codeOverride || otp.join('');
    if (code.length !== 6) { setError(locale === 'ru' ? 'Введите 6-значный код' : 'Enter 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (data.verified && data.token) {
        setToken(data.token);
        saveSession(email, data.token);
        setStep('account');
      } else { setError(data.error || 'Invalid code'); setOtp(['','','','','','']); inputRefs.current[0]?.focus(); }
    } catch(_e) { setError('Verification failed'); }
    setLoading(false);
  };

  const handleResend = async () => {
    if (countdown > 0) return; setLoading(true); setError('');
    try { const res = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const data = await res.json(); if (data.sent) { setCountdown(60); setOtp(['','','','','','']); inputRefs.current[0]?.focus(); } } catch(_e) { /* */ }
    setLoading(false);
  };

  // ===== DATA =====
  const fetchOrders = async (t) => { try { const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}&token=${encodeURIComponent(t)}`); const data = await res.json(); setOrders(Array.isArray(data) ? data : []); } catch(_e) { setOrders([]); } };
  const fetchConversations = useCallback(async () => { try { const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}`); const data = await res.json(); setConversations(Array.isArray(data) ? data : []); } catch(_e) { setConversations([]); } }, [email]);
  const loadMessages = async (convId) => { try { const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}&conversation_id=${convId}`); const data = await res.json(); if (data.conversation) setActiveConv(data.conversation); if (data.messages) setMessages(data.messages); } catch(_e) { /* */ } };

  const sendReply = async () => {
    if (!reply.trim() || !activeConv) return; setSending(true);
    try { await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, body: reply, conversation_id: activeConv.id }) }); setReply(''); await loadMessages(activeConv.id); fetchConversations(); inputRef.current?.focus(); } catch(_e) { /* */ }
    setSending(false);
  };

  const submitNewMessage = async (e) => {
    e.preventDefault(); if (!newSubject || !newBody) return; setSending(true);
    try { const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, subject: newSubject, body: newBody, order_id: newOrderId || null }) }); const data = await res.json(); if (data.conversation_id) { showToast(locale === 'ru' ? 'Отправлено!' : 'Sent!'); setNewSubject(''); setNewBody(''); setNewOrderId(''); setShowNewMsg(false); await loadMessages(data.conversation_id); fetchConversations(); } } catch(_e) { /* */ }
    setSending(false);
  };

  const logout = () => { clearSession(); setStep('email'); setOrders([]); setConversations([]); setToken(null); setEmail(''); setOtp(['','','','','','']); setActiveConv(null); setMessages([]); };

  const statusStyles = { pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' }, paid: { bg: '#e0e7ff', color: '#3730a3', label: '✅ Paid' }, delivered: { bg: '#dcfce7', color: '#166534', label: '🎉 Delivered' }, cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelled' }, refunded: { bg: '#f0e6ff', color: '#5b21b6', label: '↩️ Refunded' } };
  const convSC = { open: { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', label: locale === 'ru' ? 'Открыт' : 'Open' }, replied: { bg: '#dcfce7', color: '#166534', dot: '#22c55e', label: locale === 'ru' ? 'Ответ' : 'Replied' }, closed: { bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8', label: locale === 'ru' ? 'Закрыт' : 'Closed' } };

  if (step === 'loading') return <><Header /><main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} /></main></>;

  return (
    <><Header /><CartDrawer /><Toast />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* EMAIL */}
        {step === 'email' && (
          <div style={{ textAlign: 'center', maxWidth: 380, margin: '0 auto' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>👤</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>{locale === 'ru' ? 'Мой аккаунт' : 'My Account'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              {locale === 'ru' ? 'Войдите для доступа к заказам и сообщениям' : 'Sign in to access your orders and messages'}
            </p>
            <form onSubmit={handleSendOtp}>
              <input type="email" placeholder={t('email_placeholder')} value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required style={{ marginBottom: 12, textAlign: 'center', fontSize: 16, borderColor: error ? 'var(--danger)' : undefined }} />
              {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '12px 20px' }}>
                {loading ? '...' : (locale === 'ru' ? 'Получить код' : 'Get verification code')}
              </button>
            </form>
          </div>
        )}

        {/* OTP */}
        {step === 'otp' && (
          <div style={{ textAlign: 'center', maxWidth: 380, margin: '0 auto' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✉️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>{locale === 'ru' ? 'Проверьте почту' : 'Check your email'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>{locale === 'ru' ? 'Код отправлен на' : 'Code sent to'}</p>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 28, color: 'var(--brand)' }}>{email}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => inputRefs.current[i] = el} type="text" inputMode="numeric" maxLength={6} value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} onFocus={e => e.target.select()}
                  style={{ width: 50, height: 58, textAlign: 'center', fontSize: 24, fontWeight: 700, borderRadius: 12, border: `2px solid ${error ? 'var(--danger)' : digit ? 'var(--brand)' : 'var(--border)'}`, background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s', caretColor: 'var(--brand)' }} />
              ))}
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn-primary" disabled={loading || otp.some(d => !d)} onClick={() => handleVerifyOtp()} style={{ width: '100%', padding: '12px 20px', marginBottom: 16 }}>
              {loading ? '...' : (locale === 'ru' ? 'Войти' : 'Verify & Sign in')}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
              <button onClick={() => { setStep('email'); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>← {locale === 'ru' ? 'Назад' : 'Back'}</button>
              <button onClick={handleResend} disabled={countdown > 0} style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer', color: countdown > 0 ? 'var(--text-muted)' : 'var(--brand)', fontSize: 13, fontWeight: 500 }}>
                {countdown > 0 ? `${countdown}s` : (locale === 'ru' ? 'Отправить снова' : 'Resend')}
              </button>
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {step === 'account' && (<>
          {/* Header bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', fontWeight: 700 }}>
                {email[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{locale === 'ru' ? 'Мой аккаунт' : 'My Account'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{email}</div>
              </div>
            </div>
            <button onClick={logout} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>{locale === 'ru' ? 'Выйти' : 'Sign out'}</button>
          </div>

          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4 }}>
            {[
              { key: 'orders', icon: '📋', label: locale === 'ru' ? 'Заказы' : 'Orders', count: orders.length },
              { key: 'messages', icon: '💬', label: locale === 'ru' ? 'Сообщения' : 'Messages', count: conversations.filter(c => c.status === 'replied').length },
            ].map(tb => (
              <button key={tb.key} onClick={() => { setTab(tb.key); setActiveConv(null); setShowNewMsg(false); if (tb.key === 'messages') fetchConversations(); }} style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: tab === tb.key ? 'var(--bg-card)' : 'transparent',
                color: tab === tb.key ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: tab === tb.key ? 'var(--shadow)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {tb.icon} {tb.label}
                {tb.count > 0 && <span style={{ background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10 }}>{tb.count}</span>}
              </button>
            ))}
          </div>

          {/* ORDERS */}
          {tab === 'orders' && (
            orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}><span style={{ fontSize: 48 }}>📭</span><p style={{ marginTop: 12 }}>{locale === 'ru' ? 'Заказов пока нет' : 'No orders yet'}</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(order => {
                  const s = statusStyles[order.status] || statusStyles.pending;
                  const pName = locale === 'ru' && order.products?.name_ru ? order.products.name_ru : order.products?.name || 'Unknown';
                  return (
                    <a key={order.id} href={`/order/${order.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-primary)', transition: 'all 0.2s' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {order.products?.image_url ? <img src={order.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🎮</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{timeAgo(order.created_at)} · ${Number(order.amount).toFixed(2)}</div>
                      </div>
                      <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                    </a>
                  );
                })}
              </div>
            )
          )}

          {/* MESSAGES LIST */}
          {tab === 'messages' && !activeConv && !showNewMsg && (<>
            <button onClick={() => setShowNewMsg(true)} style={{ width: '100%', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))', color: 'white', border: 'none', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ✉️ {locale === 'ru' ? 'Новое сообщение' : 'New Message'}
            </button>
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}><span style={{ fontSize: 48 }}>💬</span><p style={{ marginTop: 12 }}>{locale === 'ru' ? 'Нет сообщений' : 'No conversations yet'}</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {conversations.map(conv => {
                  const sc = convSC[conv.status] || convSC.open;
                  const hasReply = conv.status === 'replied';
                  return (
                    <button key={conv.id} onClick={() => loadMessages(conv.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, width: '100%',
                      background: 'var(--bg-card)', border: `1px solid ${hasReply ? 'var(--brand)' : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: hasReply ? 'linear-gradient(135deg, var(--brand), var(--brand-hover))' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: hasReply ? 'white' : 'var(--text-muted)' }}>
                        {hasReply ? '💬' : conv.status === 'closed' ? '✓' : '✉️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.subject}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{timeAgo(conv.updated_at)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: hasReply ? 'var(--brand)' : 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {hasReply ? (locale === 'ru' ? 'Новый ответ от поддержки' : 'New reply from support') : (locale === 'ru' ? 'Ожидание ответа' : 'Awaiting reply')}
                        </div>
                      </div>
                      {hasReply && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </>)}

          {/* NEW MESSAGE */}
          {tab === 'messages' && showNewMsg && !activeConv && (
            <div>
              <button onClick={() => setShowNewMsg(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>← {locale === 'ru' ? 'Назад' : 'Back'}</button>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{locale === 'ru' ? 'Новое сообщение' : 'New Message'}</h2>
              <form onSubmit={submitNewMessage} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{locale === 'ru' ? 'Тема' : 'Subject'} *</label><input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder={locale === 'ru' ? 'Кратко опишите проблему' : 'Brief description'} required /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{locale === 'ru' ? 'ID заказа' : 'Order ID'} ({locale === 'ru' ? 'необязательно' : 'optional'})</label><input type="text" value={newOrderId} onChange={e => setNewOrderId(e.target.value)} placeholder="xxxxxxxx-xxxx-..." /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{locale === 'ru' ? 'Сообщение' : 'Message'} *</label><textarea rows={5} value={newBody} onChange={e => setNewBody(e.target.value)} placeholder={locale === 'ru' ? 'Подробно опишите проблему...' : 'Describe your issue in detail...'} required /></div>
                <button type="submit" className="btn-primary" disabled={sending || !newSubject || !newBody} style={{ padding: '12px 20px' }}>{sending ? '...' : (locale === 'ru' ? 'Отправить' : 'Send Message')}</button>
              </form>
            </div>
          )}

          {/* MODERN CHAT VIEW */}
          {tab === 'messages' && activeConv && (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: 400 }}>
              {/* Chat header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 14px', borderBottom: '1px solid var(--border)', marginBottom: 0, flexShrink: 0 }}>
                <button onClick={() => { setActiveConv(null); fetchConversations(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--brand), var(--brand-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 700, flexShrink: 0 }}>🛡</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConv.subject}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>KeyVault Support · {(convSC[activeConv.status] || convSC.open).label}</div>
                </div>
              </div>

              {/* Messages area */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 0',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {/* Welcome message */}
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: 10 }}>
                    {new Date(activeConv.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {messages.map((msg, idx) => {
                  const isMe = msg.sender === 'customer';
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender !== 'admin');
                  const isLast = idx === messages.length - 1 || messages[idx + 1]?.sender !== msg.sender;

                  return (
                    <div key={msg.id} style={{
                      display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                      paddingLeft: isMe ? 48 : 0, paddingRight: isMe ? 0 : 48,
                      marginBottom: isLast ? 8 : 1,
                    }}>
                      {/* Admin avatar */}
                      {!isMe && (
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginRight: 8, marginTop: 'auto',
                          background: showAvatar ? 'linear-gradient(135deg, var(--brand), var(--brand-hover))' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700,
                        }}>
                          {showAvatar ? '🛡' : ''}
                        </div>
                      )}

                      <div style={{
                        maxWidth: '78%', padding: '10px 14px',
                        borderRadius: isMe
                          ? `18px 18px ${isLast ? '4px' : '18px'} 18px`
                          : `18px 18px 18px ${isLast ? '4px' : '18px'}`,
                        background: isMe
                          ? 'linear-gradient(135deg, var(--brand), var(--brand-hover))'
                          : 'var(--bg-card)',
                        color: isMe ? 'white' : 'var(--text-primary)',
                        border: isMe ? 'none' : '1px solid var(--border)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      }}>
                        <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</div>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                          marginTop: 4, fontSize: 10,
                          color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
                        }}>
                          {formatTime(msg.created_at)}
                          {/* Ticks */}
                          <span style={{ fontSize: 12, marginLeft: 2 }}>
                            {msg.is_read
                              ? <span style={{ color: isMe ? 'rgba(255,255,255,0.9)' : 'var(--brand)', fontWeight: 700 }}>✓✓</span>
                              : <span style={{ opacity: 0.6 }}>✓</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              {activeConv.status !== 'closed' ? (
                <div style={{
                  display: 'flex', alignItems: 'flex-end', gap: 8,
                  padding: '12px 0 0', borderTop: '1px solid var(--border)', flexShrink: 0,
                }}>
                  <div style={{
                    flex: 1, background: 'var(--bg-secondary)', borderRadius: 20,
                    border: '1px solid var(--border)', padding: '0 16px',
                    display: 'flex', alignItems: 'flex-end',
                  }}>
                    <textarea ref={inputRef} rows={1} value={reply} onChange={e => {
                      setReply(e.target.value);
                      // Auto-resize
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    placeholder={locale === 'ru' ? 'Написать сообщение...' : 'Type a message...'}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    style={{
                      flex: 1, border: 'none', background: 'transparent', outline: 'none',
                      resize: 'none', padding: '10px 0', fontSize: 14, lineHeight: 1.5,
                      color: 'var(--text-primary)', minHeight: 20, maxHeight: 120,
                      width: '100%',
                    }} />
                  </div>
                  <button onClick={sendReply} disabled={sending || !reply.trim()} style={{
                    width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: reply.trim() ? 'linear-gradient(135deg, var(--brand), var(--brand-hover))' : 'var(--bg-secondary)',
                    color: reply.trim() ? 'white' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, transition: 'all 0.2s', flexShrink: 0,
                  }}>
                    ↑
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 13, borderTop: '1px solid var(--border)' }}>
                  {locale === 'ru' ? 'Беседа закрыта' : 'This conversation is closed'}
                </div>
              )}
            </div>
          )}
        </>)}
      </main>
      {!(step === 'account' && tab === 'messages' && activeConv) && <Footer />}
    </>
  );
}
