'use client';
import { useState, useRef, useEffect } from 'react';
import { useStore } from '../components/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import CartDrawer from '../components/CartDrawer';

export default function AccountPage() {
  const { t, locale, showToast } = useStore();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Account tabs
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // New message form
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newOrderId, setNewOrderId] = useState('');

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Poll active chat
  useEffect(() => {
    if (!activeConv || step !== 'account') return;
    const interval = setInterval(() => loadMessages(activeConv.id), 8000);
    return () => clearInterval(interval);
  }, [activeConv, step]);

  // ===== OTP FLOW =====
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setError(locale === 'ru' ? 'Введите корректный email' : 'Please enter a valid email'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.status === 429) { setError(`${locale === 'ru' ? 'Подождите' : 'Please wait'} ${data.retry_after}s`); setCountdown(data.retry_after || 60); }
      else if (data.sent) { setStep('otp'); setCountdown(60); setOtp(['','','','','','']); setTimeout(() => inputRefs.current[0]?.focus(), 100); }
      else setError(data.error || 'Failed');
    } catch(_e) { setError('Connection error'); }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
      if (newOtp.every(d => d !== '')) setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
      return;
    }
    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp]; newOtp[index] = digit; setOtp(newOtp);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && newOtp.every(d => d !== '')) setTimeout(() => handleVerifyOtp(newOtp.join('')), 100);
  };

  const handleOtpKeyDown = (index, e) => { if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus(); };

  const handleVerifyOtp = async (codeOverride) => {
    const code = codeOverride || otp.join('');
    if (code.length !== 6) { setError(locale === 'ru' ? 'Введите 6-значный код' : 'Enter the 6-digit code'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (data.verified && data.token) {
        setToken(data.token);
        await fetchOrders(data.token);
        await fetchConversations();
        setStep('account');
      } else { setError(data.error || (locale === 'ru' ? 'Неверный код' : 'Invalid code')); setOtp(['','','','','','']); inputRefs.current[0]?.focus(); }
    } catch(_e) { setError('Verification failed'); }
    setLoading(false);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.sent) { setCountdown(60); setOtp(['','','','','','']); inputRefs.current[0]?.focus(); }
    } catch(_e) { /* ignore */ }
    setLoading(false);
  };

  // ===== DATA FETCHING =====
  const fetchOrders = async (t) => {
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}&token=${encodeURIComponent(t)}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch(_e) { setOrders([]); }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch(_e) { setConversations([]); }
  };

  const loadMessages = async (convId) => {
    try {
      const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}&conversation_id=${convId}`);
      const data = await res.json();
      if (data.conversation) setActiveConv(data.conversation);
      if (data.messages) setMessages(data.messages);
    } catch(_e) { /* ignore */ }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeConv) return;
    setSending(true);
    try {
      await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, body: reply, conversation_id: activeConv.id }) });
      setReply(''); await loadMessages(activeConv.id); fetchConversations();
    } catch(_e) { /* ignore */ }
    setSending(false);
  };

  const submitNewMessage = async (e) => {
    e.preventDefault();
    if (!newSubject || !newBody) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, subject: newSubject, body: newBody, order_id: newOrderId || null }) });
      const data = await res.json();
      if (data.conversation_id) {
        showToast(locale === 'ru' ? 'Отправлено!' : 'Sent!');
        setNewSubject(''); setNewBody(''); setNewOrderId(''); setShowNewMsg(false);
        await loadMessages(data.conversation_id); fetchConversations();
      }
    } catch(_e) { /* ignore */ }
    setSending(false);
  };

  const logout = () => { setStep('email'); setOrders([]); setConversations([]); setToken(null); setEmail(''); setOtp(['','','','','','']); setActiveConv(null); };

  // Tick component
  const Ticks = ({ isRead, sender }) => {
    // Show ticks only on own messages
    return (
      <span style={{ fontSize: 11, marginLeft: 4 }}>
        {isRead ? (
          <span style={{ color: sender === 'customer' ? 'rgba(255,255,255,0.8)' : 'var(--brand)', fontWeight: 700 }}>✓✓</span>
        ) : (
          <span style={{ opacity: 0.5 }}>✓</span>
        )}
      </span>
    );
  };

  const statusStyles = {
    pending: { bg: '#fef3c7', color: '#92400e', label: '⏳' },
    paid: { bg: '#e0e7ff', color: '#3730a3', label: '✅' },
    delivered: { bg: '#dcfce7', color: '#166534', label: '🎉' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: '❌' },
    refunded: { bg: '#f0e6ff', color: '#5b21b6', label: '↩️' },
  };

  const convStatusColors = {
    open: { bg: '#fef3c7', color: '#92400e', label: locale === 'ru' ? 'Открыт' : 'Open' },
    replied: { bg: '#dcfce7', color: '#166534', label: locale === 'ru' ? 'Ответ' : 'Replied' },
    closed: { bg: '#f1f5f9', color: '#64748b', label: locale === 'ru' ? 'Закрыт' : 'Closed' },
  };

  return (
    <><Header /><CartDrawer /><Toast />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>

        {/* ===== EMAIL STEP ===== */}
        {step === 'email' && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48 }}>👤</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 8px' }}>{locale === 'ru' ? 'Мой аккаунт' : 'My Account'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
              {locale === 'ru' ? 'Введите email для доступа к заказам и сообщениям.' : 'Enter your email to access orders and messages.'}
            </p>
            <form onSubmit={handleSendOtp}>
              <input type="email" placeholder={t('email_placeholder')} value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required style={{ marginBottom: 12, textAlign: 'center', fontSize: 16, borderColor: error ? 'var(--danger)' : undefined }} />
              {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? '...' : (locale === 'ru' ? 'Отправить код' : 'Send verification code')}
              </button>
            </form>
          </div>
        )}

        {/* ===== OTP STEP ===== */}
        {step === 'otp' && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48 }}>✉️</span>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '12px 0 8px' }}>{locale === 'ru' ? 'Введите код' : 'Enter verification code'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>{locale === 'ru' ? 'Мы отправили 6-значный код на' : 'We sent a 6-digit code to'}</p>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 28 }}>{email}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {otp.map((digit, i) => (
                <input key={i} ref={el => inputRefs.current[i] = el} type="text" inputMode="numeric" maxLength={6} value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)} onFocus={e => e.target.select()}
                  style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, borderRadius: 10,
                    border: `2px solid ${error ? 'var(--danger)' : digit ? 'var(--brand)' : 'var(--border)'}`,
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', caretColor: 'var(--brand)' }} />
              ))}
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button className="btn-primary" disabled={loading || otp.some(d => !d)} onClick={() => handleVerifyOtp()} style={{ width: '100%', marginBottom: 16 }}>
              {loading ? '...' : (locale === 'ru' ? 'Подтвердить' : 'Verify')}
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button onClick={() => { setStep('email'); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
                ← {locale === 'ru' ? 'Сменить email' : 'Change email'}
              </button>
              <button onClick={handleResend} disabled={countdown > 0 || loading} style={{ background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer', color: countdown > 0 ? 'var(--text-muted)' : 'var(--brand)', fontSize: 13, fontWeight: 500 }}>
                {countdown > 0 ? `${locale === 'ru' ? 'Повторить через' : 'Resend in'} ${countdown}s` : (locale === 'ru' ? 'Отправить снова' : 'Resend code')}
              </button>
            </div>
          </div>
        )}

        {/* ===== ACCOUNT (LOGGED IN) ===== */}
        {step === 'account' && (<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>👤 {locale === 'ru' ? 'Мой аккаунт' : 'My Account'}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>{email}</p>
            </div>
            <button onClick={logout} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>{locale === 'ru' ? 'Выйти' : 'Logout'}</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <button onClick={() => { setTab('orders'); setActiveConv(null); }} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
              color: tab === 'orders' ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: tab === 'orders' ? '2px solid var(--brand)' : '2px solid transparent',
            }}>📋 {locale === 'ru' ? 'Заказы' : 'Orders'} ({orders.length})</button>
            <button onClick={() => { setTab('messages'); setActiveConv(null); fetchConversations(); }} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
              color: tab === 'messages' ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: tab === 'messages' ? '2px solid var(--brand)' : '2px solid transparent',
            }}>💬 {locale === 'ru' ? 'Сообщения' : 'Messages'} ({conversations.filter(c => c.status === 'replied').length > 0 ? conversations.filter(c => c.status === 'replied').length : conversations.length})</button>
          </div>

          {/* ORDERS TAB */}
          {tab === 'orders' && (
            orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 40 }}>📭</span>
                <p style={{ marginTop: 8 }}>{locale === 'ru' ? 'Заказы не найдены' : 'No orders found'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orders.map(order => {
                  const s = statusStyles[order.status] || statusStyles.pending;
                  const pName = locale === 'ru' && order.products?.name_ru ? order.products.name_ru : order.products?.name || 'Unknown';
                  return (
                    <a key={order.id} href={`/order/${order.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12,
                      background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-primary)',
                    }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {order.products?.image_url ? <img src={order.products.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🎮</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(order.created_at).toLocaleDateString()} · ${Number(order.amount).toFixed(2)}</div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</span>
                    </a>
                  );
                })}
              </div>
            )
          )}

          {/* MESSAGES TAB */}
          {tab === 'messages' && !activeConv && !showNewMsg && (<>
            <button onClick={() => setShowNewMsg(true)} className="btn-primary" style={{ width: '100%', marginBottom: 16 }}>
              ✉️ {locale === 'ru' ? 'Новое сообщение' : 'New Message'}
            </button>
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 40 }}>💬</span>
                <p style={{ marginTop: 8 }}>{locale === 'ru' ? 'Нет сообщений' : 'No conversations yet'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {conversations.map(conv => {
                  const sc = convStatusColors[conv.status] || convStatusColors.open;
                  return (
                    <button key={conv.id} onClick={() => loadMessages(conv.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12, width: '100%',
                      background: 'var(--bg-card)', border: `1px solid ${conv.status === 'replied' ? 'var(--brand)' : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: conv.status === 'replied' ? 'var(--brand-light)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {conv.status === 'replied' ? '💬' : conv.status === 'closed' ? '✓' : '✉️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.subject}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{new Date(conv.updated_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>)}

          {/* NEW MESSAGE FORM */}
          {tab === 'messages' && showNewMsg && !activeConv && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button onClick={() => setShowNewMsg(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>←</button>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{locale === 'ru' ? 'Новое сообщение' : 'New Message'}</h2>
              </div>
              <form onSubmit={submitNewMessage} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{locale === 'ru' ? 'Тема *' : 'Subject *'}</label><input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder={locale === 'ru' ? 'Кратко опишите проблему' : 'Brief description'} required /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{locale === 'ru' ? 'ID заказа' : 'Order ID (optional)'}</label><input type="text" value={newOrderId} onChange={e => setNewOrderId(e.target.value)} placeholder="xxxxxxxx-xxxx-..." /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{locale === 'ru' ? 'Сообщение *' : 'Message *'}</label><textarea rows={5} value={newBody} onChange={e => setNewBody(e.target.value)} placeholder={locale === 'ru' ? 'Подробно опишите проблему...' : 'Describe your issue...'} required /></div>
                <button type="submit" className="btn-primary" disabled={sending || !newSubject || !newBody}>{sending ? '...' : (locale === 'ru' ? 'Отправить' : 'Send')}</button>
              </form>
            </div>
          )}

          {/* CHAT VIEW */}
          {tab === 'messages' && activeConv && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button onClick={() => { setActiveConv(null); fetchConversations(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>←</button>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{activeConv.subject}</h2>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(convStatusColors[activeConv.status] || convStatusColors.open).label}</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, minHeight: 300, maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'customer' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: msg.sender === 'customer' ? 'var(--brand)' : 'var(--bg-card)', color: msg.sender === 'customer' ? 'white' : 'var(--text-primary)', border: msg.sender === 'admin' ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>{msg.sender === 'customer' ? (locale === 'ru' ? 'Вы' : 'You') : '🛡 KeyVault'}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                        {new Date(msg.created_at).toLocaleString()}
                        <Ticks isRead={msg.is_read} sender={msg.sender} />
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {activeConv.status !== 'closed' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <textarea rows={2} value={reply} onChange={e => setReply(e.target.value)} placeholder={locale === 'ru' ? 'Введите ответ...' : 'Type your reply...'} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }} style={{ flex: 1 }} />
                  <button className="btn-primary" onClick={sendReply} disabled={sending || !reply.trim()} style={{ alignSelf: 'flex-end', padding: '10px 16px' }}>→</button>
                </div>
              )}
            </div>
          )}
        </>)}
      </main>
      <Footer />
    </>
  );
}
