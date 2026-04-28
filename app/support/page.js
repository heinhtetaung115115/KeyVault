'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '../components/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

export default function SupportPage() {
  const { t, locale, showToast } = useStore();
  const [view, setView] = useState('home');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [emailError, setEmailError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!activeConv || view !== 'chat') return;
    const interval = setInterval(() => loadMessages(activeConv.id), 8000);
    return () => clearInterval(interval);
  }, [activeConv, view]);

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setEmailError(locale === 'ru' ? 'Введите корректный email' : 'Please enter a valid email'); return; }
    if (!subject || !message) return;
    setEmailError('');
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, body: message, order_id: orderId || null }),
      });
      const data = await res.json();
      if (data.conversation_id) {
        showToast(locale === 'ru' ? 'Сообщение отправлено!' : 'Message sent!');
        setSubject(''); setMessage(''); setOrderId('');
        await loadConversation(data.conversation_id);
        setView('chat');
      } else { showToast(data.error || 'Failed to send', 'error'); }
    } catch(_e) { showToast('Error sending message', 'error'); }
    setSending(false);
  };

  const loadConversations = async () => {
    if (!email || !email.includes('@')) { setEmailError(locale === 'ru' ? 'Введите email' : 'Enter your email first'); return; }
    setEmailError('');
    try {
      const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      setView('conversations');
    } catch(_e) { setConversations([]); }
  };

  const loadConversation = async (convId) => {
    try {
      const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}&conversation_id=${convId}`);
      const data = await res.json();
      if (data.conversation) { setActiveConv(data.conversation); setMessages(data.messages || []); }
    } catch(_e) { /* ignore */ }
  };

  const loadMessages = async (convId) => {
    try {
      const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}&conversation_id=${convId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch(_e) { /* ignore */ }
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeConv) return;
    setSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, body: reply, conversation_id: activeConv.id }),
      });
      setReply('');
      await loadMessages(activeConv.id);
    } catch(_e) { /* ignore */ }
    setSending(false);
  };

  const statusColors = {
    open: { bg: '#fef3c7', color: '#92400e', label: locale === 'ru' ? 'Открыт' : 'Open' },
    replied: { bg: '#dcfce7', color: '#166534', label: locale === 'ru' ? 'Ответ получен' : 'Replied' },
    closed: { bg: '#f1f5f9', color: '#64748b', label: locale === 'ru' ? 'Закрыт' : 'Closed' },
  };

  return (
    <><Header /><CartDrawer /><Toast />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px' }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}>← {locale === 'ru' ? 'Назад в магазин' : 'Back to store'}</a>

        {/* HOME */}
        {view === 'home' && (<>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 8px' }}>{locale === 'ru' ? 'Поддержка' : 'Support'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            {locale === 'ru' ? 'Нужна помощь? Отправьте сообщение или проверьте существующие обращения.' : 'Need help? Send us a message or check your existing conversations.'}
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{locale === 'ru' ? 'Ваш email' : 'Your email'}</label>
            <input type="email" placeholder={t('email_placeholder')} value={email} onChange={e => { setEmail(e.target.value); setEmailError(''); }} style={{ borderColor: emailError ? 'var(--danger)' : undefined }} />
            {emailError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>{emailError}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => { if (!email || !email.includes('@')) { setEmailError(locale === 'ru' ? 'Введите email' : 'Enter your email'); return; } setView('new'); }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 28 }}>✉️</span>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px' }}>{locale === 'ru' ? 'Новое сообщение' : 'New Message'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{locale === 'ru' ? 'Задайте вопрос или сообщите о проблеме' : 'Ask a question or report an issue'}</p>
            </button>
            <button onClick={loadConversations} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 28 }}>💬</span>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px' }}>{locale === 'ru' ? 'Мои обращения' : 'My Conversations'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{locale === 'ru' ? 'Посмотреть историю и ответы' : 'View history and replies'}</p>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <a href="/orders" style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, textDecoration: 'none', color: 'inherit', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>📋 {locale === 'ru' ? 'Мои заказы' : 'My Orders'}</a>
            <a href="/faq" style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, textDecoration: 'none', color: 'inherit', fontSize: 13, fontWeight: 500, textAlign: 'center' }}>❓ FAQ</a>
          </div>
        </>)}

        {/* NEW MESSAGE */}
        {view === 'new' && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 20px' }}>
            <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>←</button>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{locale === 'ru' ? 'Новое сообщение' : 'New Message'}</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{email}</p>
          <form onSubmit={submitTicket} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{locale === 'ru' ? 'Тема *' : 'Subject *'}</label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder={locale === 'ru' ? 'Кратко опишите проблему' : 'Brief description of your issue'} required /></div>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{locale === 'ru' ? 'ID заказа (если есть)' : 'Order ID (optional)'}</label><input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="xxxxxxxx-xxxx-..." /></div>
            <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{locale === 'ru' ? 'Сообщение *' : 'Message *'}</label><textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder={locale === 'ru' ? 'Подробно опишите вашу проблему...' : 'Describe your issue in detail...'} required /></div>
            <button type="submit" className="btn-primary" disabled={sending || !subject || !message}>{sending ? '...' : (locale === 'ru' ? 'Отправить' : 'Send Message')}</button>
          </form>
        </>)}

        {/* CONVERSATIONS LIST */}
        {view === 'conversations' && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 20px' }}>
            <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>←</button>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{locale === 'ru' ? 'Мои обращения' : 'My Conversations'}</h1>
          </div>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 40 }}>💬</span>
              <p style={{ marginTop: 8 }}>{locale === 'ru' ? 'Нет обращений' : 'No conversations yet'}</p>
              <button onClick={() => setView('new')} className="btn-primary" style={{ marginTop: 16 }}>{locale === 'ru' ? 'Написать' : 'Send a message'}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conversations.map(conv => {
                const sc = statusColors[conv.status] || statusColors.open;
                return (
                  <button key={conv.id} onClick={async () => { await loadConversation(conv.id); setView('chat'); }} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12,
                    background: 'var(--bg-card)', border: `1px solid ${conv.status === 'replied' ? 'var(--brand)' : 'var(--border)'}`,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
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

        {/* CHAT VIEW */}
        {view === 'chat' && activeConv && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
            <button onClick={() => { setView('conversations'); setActiveConv(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>←</button>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{activeConv.subject}</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeConv.email}</span>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: (statusColors[activeConv.status] || statusColors.open).bg, color: (statusColors[activeConv.status] || statusColors.open).color }}>
              {(statusColors[activeConv.status] || statusColors.open).label}
            </span>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, minHeight: 300, maxHeight: 500, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'customer' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 12, background: msg.sender === 'customer' ? 'var(--brand)' : 'var(--bg-card)', color: msg.sender === 'customer' ? 'white' : 'var(--text-primary)', border: msg.sender === 'admin' ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>{msg.sender === 'customer' ? (locale === 'ru' ? 'Вы' : 'You') : '🛡 KeyVault'}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                  <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>{new Date(msg.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {activeConv.status !== 'closed' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <textarea rows={2} value={reply} onChange={e => setReply(e.target.value)}
                placeholder={locale === 'ru' ? 'Введите ответ...' : 'Type your reply...'}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                style={{ flex: 1 }} />
              <button className="btn-primary" onClick={sendReply} disabled={sending || !reply.trim()} style={{ alignSelf: 'flex-end', padding: '10px 16px' }}>→</button>
            </div>
          )}
        </>)}
      </main>
      <Footer />
    </>
  );
}
