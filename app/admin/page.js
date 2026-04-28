'use client';
import { useState, useEffect, useCallback } from 'react';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', name_ru: '', slug: '', description: '', description_ru: '', price: '', image_url: '', category_id: '', delivery_type: 'auto', is_featured: false, is_active: true });
  const [keyProductId, setKeyProductId] = useState('');
  const [keyText, setKeyText] = useState('');
  const [productKeys, setProductKeys] = useState([]);
  const [viewingKeysFor, setViewingKeysFor] = useState(null);
  const [deliverOrderId, setDeliverOrderId] = useState('');
  const [deliverContent, setDeliverContent] = useState('');
  const [conversations, setConversations] = useState([]);
  const [convFilter, setConvFilter] = useState('');
  const [activeConv, setActiveConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [adminReply, setAdminReply] = useState('');

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${password}` };
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const login = async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${password}` } });
      if (res.ok) { setAuthed(true); localStorage.setItem('kv-admin', password); }
      else flash('Invalid password');
    } catch(_e) { flash('Connection error'); }
  };

  useEffect(() => { const saved = localStorage.getItem('kv-admin'); if (saved) { setPassword(saved); setAuthed(true); } }, []);

  const fetchProducts = useCallback(async () => {
    try { const res = await fetch('/api/admin/products', { headers }); const data = await res.json(); setProducts(Array.isArray(data) ? data : []); } catch(_e) { /* ignore */ }
  }, [password]);

  const fetchCategories = useCallback(async () => {
    try { const res = await fetch('/api/categories'); const data = await res.json(); setCategories(Array.isArray(data) ? data : []); } catch(_e) { /* ignore */ }
  }, []);

  const fetchOrders = useCallback(async () => {
    try { const params = orderFilter ? `?status=${orderFilter}` : ''; const res = await fetch(`/api/admin/orders${params}`, { headers }); const data = await res.json(); setOrders(data.orders || []); } catch(_e) { /* ignore */ }
  }, [password, orderFilter]);

  useEffect(() => { if (authed) { fetchProducts(); fetchCategories(); fetchOrders(); fetchConversations(); } }, [authed, fetchProducts, fetchCategories, fetchOrders]);

  const fetchConversations = useCallback(async () => {
    try {
      const params = convFilter ? `?status=${convFilter}` : '';
      const res = await fetch(`/api/admin/messages${params}`, { headers });
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch(_e) { /* ignore */ }
  }, [password, convFilter]);

  const openConversation = async (convId) => {
    try {
      const res = await fetch(`/api/admin/messages?conversation_id=${convId}`, { headers });
      const data = await res.json();
      if (data.conversation) { setActiveConv(data.conversation); setConvMessages(data.messages || []); }
    } catch(_e) { /* ignore */ }
  };

  const sendAdminReply = async () => {
    if (!adminReply.trim() || !activeConv) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages', { method: 'POST', headers, body: JSON.stringify({ conversation_id: activeConv.id, body: adminReply }) });
      const data = await res.json();
      if (data.success) { flash('Reply sent + email notified!'); setAdminReply(''); await openConversation(activeConv.id); fetchConversations(); }
      else flash(data.error || 'Failed');
    } catch(_e) { flash('Error'); }
    setLoading(false);
  };

  const updateConvStatus = async (convId, status) => {
    await fetch('/api/admin/messages', { method: 'PUT', headers, body: JSON.stringify({ conversation_id: convId, status }) });
    flash(`Conversation ${status}`);
    fetchConversations();
    if (activeConv?.id === convId) setActiveConv(prev => ({ ...prev, status }));
  };

  const resetForm = () => { setForm({ name: '', name_ru: '', slug: '', description: '', description_ru: '', price: '', image_url: '', category_id: '', delivery_type: 'auto', is_featured: false, is_active: true }); setEditProduct(null); };

  const startEdit = (p) => { setEditProduct(p.id); setForm({ name: p.name || '', name_ru: p.name_ru || '', slug: p.slug || '', description: p.description || '', description_ru: p.description_ru || '', price: p.price || '', image_url: p.image_url || '', category_id: p.category_id || '', delivery_type: p.delivery_type || 'auto', is_featured: p.is_featured || false, is_active: p.is_active !== false }); };

  const saveProduct = async () => {
    setLoading(true);
    const payload = { ...form, price: parseFloat(form.price) || 0 };
    if (!payload.category_id) delete payload.category_id;
    try {
      if (editProduct) { await fetch('/api/admin/products', { method: 'PUT', headers, body: JSON.stringify({ id: editProduct, ...payload }) }); flash('Product updated'); }
      else { await fetch('/api/admin/products', { method: 'POST', headers, body: JSON.stringify(payload) }); flash('Product created'); }
      resetForm(); fetchProducts();
    } catch(_e) { flash('Error saving'); }
    setLoading(false);
  };

  const deleteProduct = async (id) => { if (!confirm('Delete this product and all its keys?')) return; await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE', headers }); flash('Product deleted'); fetchProducts(); };

  const uploadKeys = async () => {
    if (!keyProductId || !keyText.trim()) return;
    setLoading(true);
    const keys = keyText.split('\n').map(k => k.trim()).filter(Boolean);
    try { const res = await fetch('/api/admin/keys', { method: 'POST', headers, body: JSON.stringify({ product_id: keyProductId, keys }) }); const data = await res.json(); flash(`${data.inserted || 0} keys uploaded`); setKeyText(''); fetchProducts(); } catch(_e) { flash('Upload error'); }
    setLoading(false);
  };

  const viewKeys = async (productId) => {
    setViewingKeysFor(productId);
    try { const res = await fetch(`/api/admin/keys?product_id=${productId}`, { headers }); const data = await res.json(); setProductKeys(Array.isArray(data) ? data : []); } catch(_e) { setProductKeys([]); }
  };

  const deleteKey = async (id) => { await fetch(`/api/admin/keys?id=${id}`, { method: 'DELETE', headers }); if (viewingKeysFor) viewKeys(viewingKeysFor); fetchProducts(); };

  const manualDeliver = async () => {
    if (!deliverOrderId || !deliverContent) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/deliver', { method: 'POST', headers, body: JSON.stringify({ order_id: deliverOrderId, content: deliverContent }) });
      const data = await res.json();
      if (data.success) { flash('Content delivered!'); setDeliverOrderId(''); setDeliverContent(''); fetchOrders(); }
      else flash(data.error || 'Delivery failed');
    } catch(_e) { flash('Error'); }
    setLoading(false);
  };

  const s = {
    card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 },
    cardTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 16px' },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: { textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' },
    td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
    smallBtn: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 13 },
  };

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 380, width: '100%' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>🔐 Admin Login</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>Enter your admin password</p>
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} style={{ marginBottom: 12 }} />
        <button className="btn-primary" onClick={login} style={{ width: '100%' }}>Login</button>
        {msg && <p style={{ color: 'var(--danger)', marginTop: 8, fontSize: 13 }}>{msg}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ background: 'var(--brand)', color: 'white', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>K</a>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Admin Dashboard</span>
        </div>
        <button onClick={() => { localStorage.removeItem('kv-admin'); setAuthed(false); }} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Logout</button>
      </div>

      {msg && <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200, padding: '10px 18px', borderRadius: 8, background: '#dcfce7', color: '#166534', fontSize: 14, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', padding: '0 24px', background: 'var(--bg-card)' }}>
        {['products', 'keys', 'orders', 'messages'].map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'messages') fetchConversations(); }} style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: tab === t ? 'var(--brand)' : 'var(--text-muted)', borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent', textTransform: 'capitalize' }}>
            {t === 'products' ? '📦 Products' : t === 'keys' ? '🔑 Keys' : t === 'orders' ? '📋 Orders' : `💬 Messages${conversations.filter(c => c.status === 'open').length > 0 ? ` (${conversations.filter(c => c.status === 'open').length})` : ''}`}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        {tab === 'products' && (<>
          <div style={s.card}>
            <h3 style={s.cardTitle}>{editProduct ? '✏️ Edit Product' : '➕ New Product'}</h3>
            <div style={s.grid2}>
              <div><label style={s.label}>Name (EN)*</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label style={s.label}>Name (RU)</label><input value={form.name_ru} onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} /></div>
              <div><label style={s.label}>Slug</label><input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" /></div>
              <div><label style={s.label}>Price (USD)*</label><input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><label style={s.label}>Image URL</label><input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
              <div><label style={s.label}>Category</label><select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}><option value="">None</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label style={s.label}>Delivery Type</label><select value={form.delivery_type} onChange={e => setForm(f => ({ ...f, delivery_type: e.target.value }))}><option value="auto">Auto (instant)</option><option value="manual">Manual (admin delivers)</option></select></div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}><input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />Featured</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />Active</label>
              </div>
            </div>
            <div style={s.grid2}>
              <div><label style={s.label}>Description (EN)</label><textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><label style={s.label}>Description (RU)</label><textarea rows={3} value={form.description_ru} onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn-primary" onClick={saveProduct} disabled={loading || !form.name || !form.price}>{editProduct ? 'Update' : 'Create'} Product</button>
              {editProduct && <button className="btn-secondary" onClick={resetForm}>Cancel</button>}
            </div>
          </div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📦 All Products ({products.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}><thead><tr><th style={s.th}>Product</th><th style={s.th}>Price</th><th style={s.th}>Delivery</th><th style={s.th}>Stock</th><th style={s.th}>Status</th><th style={s.th}>Actions</th></tr></thead>
              <tbody>{products.map(p => (
                <tr key={p.id}>
                  <td style={s.td}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>{p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎮'}</div><div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.categories?.name || '—'}</div></div></div></td>
                  <td style={s.td}>${Number(p.price).toFixed(2)}</td>
                  <td style={s.td}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: p.delivery_type === 'auto' ? '#dcfce7' : '#fef3c7', color: p.delivery_type === 'auto' ? '#166534' : '#92400e' }}>{p.delivery_type === 'auto' ? '⚡ Auto' : '🕐 Manual'}</span></td>
                  <td style={s.td}><span style={{ fontWeight: 600 }}>{p.stock_count}</span><span style={{ color: 'var(--text-muted)' }}> / {p.total_keys}</span></td>
                  <td style={s.td}><span style={{ width: 8, height: 8, borderRadius: '50%', background: p.is_active ? '#22c55e' : '#ef4444', display: 'inline-block', marginRight: 6 }} />{p.is_active ? 'Active' : 'Inactive'}</td>
                  <td style={s.td}><div style={{ display: 'flex', gap: 6 }}><button onClick={() => startEdit(p)} style={s.smallBtn}>✏️</button><button onClick={() => { setKeyProductId(p.id); setTab('keys'); }} style={s.smallBtn}>🔑</button><button onClick={() => deleteProduct(p.id)} style={{ ...s.smallBtn, color: '#ef4444' }}>🗑</button></div></td>
                </tr>
              ))}</tbody></table>
            </div>
          </div>
        </>)}

        {tab === 'keys' && (<>
          <div style={s.card}>
            <h3 style={s.cardTitle}>🔑 Upload Keys</h3>
            <div style={{ marginBottom: 12 }}><label style={s.label}>Select Product</label><select value={keyProductId} onChange={e => setKeyProductId(e.target.value)}><option value="">Choose a product...</option>{products.filter(p => p.delivery_type === 'auto').map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock_count})</option>)}</select></div>
            <div style={{ marginBottom: 12 }}><label style={s.label}>Keys (one per line)</label><textarea rows={8} value={keyText} onChange={e => setKeyText(e.target.value)} placeholder={"XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY"} /></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-primary" onClick={uploadKeys} disabled={loading || !keyProductId || !keyText.trim()}>Upload {keyText.split('\n').filter(l => l.trim()).length} keys</button>
              {keyProductId && <button className="btn-secondary" onClick={() => viewKeys(keyProductId)}>View existing keys</button>}
            </div>
          </div>
          {viewingKeysFor && (
            <div style={s.card}>
              <h3 style={s.cardTitle}>Keys for: {products.find(p => p.id === viewingKeysFor)?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14 }}>({productKeys.length} total)</span></h3>
              <div style={{ maxHeight: 400, overflow: 'auto' }}><table style={s.table}><thead><tr><th style={s.th}>Key</th><th style={s.th}>Status</th><th style={s.th}>Date</th><th style={s.th}>Action</th></tr></thead>
              <tbody>{productKeys.map(k => (
                <tr key={k.id}><td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{k.key_content.length > 40 ? k.key_content.slice(0, 40) + '...' : k.key_content}</td>
                <td style={s.td}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: k.is_sold ? '#fee2e2' : '#dcfce7', color: k.is_sold ? '#991b1b' : '#166534' }}>{k.is_sold ? 'Sold' : 'Available'}</span></td>
                <td style={{ ...s.td, fontSize: 12 }}>{new Date(k.created_at).toLocaleDateString()}</td>
                <td style={s.td}>{!k.is_sold && <button onClick={() => deleteKey(k.id)} style={s.smallBtn}>🗑</button>}</td></tr>
              ))}</tbody></table></div>
            </div>
          )}
        </>)}

        {tab === 'orders' && (<>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📬 Manual Delivery</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Deliver content to a paid order with manual delivery type.</p>
            <div style={s.grid2}>
              <div><label style={s.label}>Order ID</label><input value={deliverOrderId} onChange={e => setDeliverOrderId(e.target.value)} placeholder="Paste order UUID" /></div>
              <div><label style={s.label}>Content to deliver</label><textarea rows={3} value={deliverContent} onChange={e => setDeliverContent(e.target.value)} placeholder="Key, code, link..." /></div>
            </div>
            <button className="btn-primary" onClick={manualDeliver} disabled={loading || !deliverOrderId || !deliverContent} style={{ marginTop: 12 }}>Deliver Now</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['', 'pending', 'paid', 'delivered', 'cancelled'].map(st => (
              <button key={st} onClick={() => setOrderFilter(st)} className={`chip ${orderFilter === st ? 'active' : ''}`}>{st || 'All'}</button>
            ))}
          </div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📋 Orders ({orders.length})</h3>
            <div style={{ overflowX: 'auto' }}><table style={s.table}><thead><tr><th style={s.th}>Order</th><th style={s.th}>Product</th><th style={s.th}>Email</th><th style={s.th}>Amount</th><th style={s.th}>Method</th><th style={s.th}>Status</th><th style={s.th}>Date</th><th style={s.th}>Action</th></tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o.id}>
                <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 11 }}>{o.id.slice(0, 8)}</td>
                <td style={{ ...s.td, fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.products?.name || '—'}</td>
                <td style={{ ...s.td, fontSize: 12 }}>{o.buyer_email}</td>
                <td style={s.td}>${Number(o.amount).toFixed(2)}</td>
                <td style={s.td}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: o.payment_method === 'stripe' ? '#e0e7ff' : '#fef3c7', color: o.payment_method === 'stripe' ? '#3730a3' : '#92400e' }}>{o.payment_method === 'stripe' ? '💳 Card' : '₿ Crypto'}</span></td>
                <td style={s.td}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: o.status === 'delivered' ? '#dcfce7' : o.status === 'paid' ? '#e0e7ff' : o.status === 'pending' ? '#fef3c7' : '#fee2e2', color: o.status === 'delivered' ? '#166534' : o.status === 'paid' ? '#3730a3' : o.status === 'pending' ? '#92400e' : '#991b1b' }}>{o.status}</span></td>
                <td style={{ ...s.td, fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td style={s.td}>{o.status === 'paid' && o.delivery_type === 'manual' && <button onClick={() => { setDeliverOrderId(o.id); window.scrollTo(0, 0); }} style={s.smallBtn}>📬</button>}</td>
              </tr>
            ))}</tbody></table></div>
          </div>
        </>)}

        {/* ===================== MESSAGES TAB ===================== */}
        {tab === 'messages' && (<>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['', 'open', 'replied', 'closed'].map(st => (
              <button key={st} onClick={() => setConvFilter(st)} className={`chip ${convFilter === st ? 'active' : ''}`}>
                {st === '' ? 'All' : st === 'open' ? '🔴 Open' : st === 'replied' ? '✅ Replied' : '✓ Closed'}
              </button>
            ))}
            <button onClick={fetchConversations} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>🔄 Refresh</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: activeConv ? '300px 1fr' : '1fr', gap: 16 }}>
            {/* Conversation list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 600, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 32 }}>💬</span><p style={{ marginTop: 8, fontSize: 13 }}>No conversations</p>
                </div>
              ) : conversations.map(conv => {
                const isActive = activeConv?.id === conv.id;
                const stColor = conv.status === 'open' ? '#f59e0b' : conv.status === 'replied' ? '#22c55e' : '#94a3b8';
                return (
                  <button key={conv.id} onClick={() => openConversation(conv.id)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10, width: '100%',
                    background: isActive ? 'var(--brand-light)' : 'var(--bg-card)',
                    border: `1px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stColor, flexShrink: 0, marginTop: 6 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.subject}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{conv.email}</div>
                      {conv.last_message && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.last_message.sender === 'admin' ? '↩ ' : ''}{conv.last_message.body.slice(0, 60)}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(conv.updated_at).toLocaleString()}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Chat panel */}
            {activeConv && (
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{activeConv.subject}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {activeConv.email} · {activeConv.status}
                      {activeConv.order_id && <span> · Order: {activeConv.order_id.slice(0, 8)}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {activeConv.status !== 'closed' && (
                      <button onClick={() => updateConvStatus(activeConv.id, 'closed')} style={s.smallBtn}>✓ Close</button>
                    )}
                    {activeConv.status === 'closed' && (
                      <button onClick={() => updateConvStatus(activeConv.id, 'open')} style={s.smallBtn}>↻ Reopen</button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {convMessages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '85%', padding: '8px 12px', borderRadius: 10,
                        background: msg.sender === 'admin' ? 'var(--brand)' : 'var(--bg-card)',
                        color: msg.sender === 'admin' ? 'white' : 'var(--text-primary)',
                        border: msg.sender === 'customer' ? '1px solid var(--border)' : 'none',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 3, opacity: 0.7 }}>
                          {msg.sender === 'admin' ? 'You (Admin)' : `${activeConv.email}`}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.body}</div>
                        <div style={{ fontSize: 9, opacity: 0.5, marginTop: 3, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                          {new Date(msg.created_at).toLocaleString()}
                          <span style={{ fontSize: 11, marginLeft: 4 }}>
                            {msg.is_read
                              ? <span style={{ color: msg.sender === 'admin' ? 'rgba(255,255,255,0.8)' : 'var(--brand)', fontWeight: 700 }}>✓✓</span>
                              : <span style={{ opacity: 0.5 }}>✓</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply box */}
                {activeConv.status !== 'closed' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <textarea rows={2} value={adminReply} onChange={e => setAdminReply(e.target.value)}
                      placeholder="Type your reply... (customer gets email notification)"
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminReply(); } }}
                      style={{ flex: 1 }} />
                    <button className="btn-primary" onClick={sendAdminReply} disabled={loading || !adminReply.trim()} style={{ alignSelf: 'flex-end', padding: '10px 16px' }}>
                      Reply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>)}
      </div>
    </div>
  );
}
