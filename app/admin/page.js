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

  // Product form state
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    name: '', name_ru: '', slug: '', description: '', description_ru: '',
    price: '', image_url: '', category_id: '', delivery_type: 'auto',
    is_featured: false, is_active: true, user_inputs: [],
  });

  // Plans management
  const [plans, setPlans] = useState([]);
  const [planForm, setPlanForm] = useState({ name: '', name_ru: '', price: '', sort_order: 0 });
  const [managingPlansFor, setManagingPlansFor] = useState(null);

  // User input field builder
  const [newInput, setNewInput] = useState({ label: '', label_ru: '', placeholder: '', required: false });

  // Key upload state
  const [keyProductId, setKeyProductId] = useState('');
  const [keyText, setKeyText] = useState('');
  const [productKeys, setProductKeys] = useState([]);
  const [viewingKeysFor, setViewingKeysFor] = useState(null);

  // Deliver state
  const [deliverOrderId, setDeliverOrderId] = useState('');
  const [deliverContent, setDeliverContent] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${password}`,
  };

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // Auth check
  const login = async () => {
    try {
      const res = await fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${password}` } });
      if (res.ok) {
        setAuthed(true);
        localStorage.setItem('kv-admin', password);
      } else {
        flash('Invalid password');
      }
    } catch(_e) {
      flash('Connection error');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('kv-admin');
    if (saved) { setPassword(saved); setAuthed(true); }
  }, []);

  // Fetch data
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products', { headers });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch(_e) {}
  }, [password]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch(_e) {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const params = orderFilter ? `?status=${orderFilter}` : '';
      const res = await fetch(`/api/admin/orders${params}`, { headers });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch(_e) {}
  }, [password, orderFilter]);

  useEffect(() => {
    if (authed) {
      fetchProducts();
      fetchCategories();
      fetchOrders();
    }
  }, [authed, fetchProducts, fetchCategories, fetchOrders]);

  // Product CRUD
  const resetForm = () => {
    setForm({
      name: '', name_ru: '', slug: '', description: '', description_ru: '',
      price: '', image_url: '', category_id: '', delivery_type: 'auto',
      is_featured: false, is_active: true, user_inputs: [],
    });
    setEditProduct(null);
  };

  const startEdit = (p) => {
    setEditProduct(p.id);
    setForm({
      name: p.name || '', name_ru: p.name_ru || '', slug: p.slug || '',
      description: p.description || '', description_ru: p.description_ru || '',
      price: p.price || '', image_url: p.image_url || '',
      category_id: p.category_id || '', delivery_type: p.delivery_type || 'auto',
      is_featured: p.is_featured || false, is_active: p.is_active !== false,
      user_inputs: p.user_inputs || [],
    });
  };

  const saveProduct = async () => {
    setLoading(true);
    const payload = { ...form, price: parseFloat(form.price) || 0 };
    if (!payload.category_id) delete payload.category_id;
    try {
      if (editProduct) {
        await fetch('/api/admin/products', {
          method: 'PUT', headers,
          body: JSON.stringify({ id: editProduct, ...payload }),
        });
        flash('Product updated');
      } else {
        await fetch('/api/admin/products', {
          method: 'POST', headers,
          body: JSON.stringify(payload),
        });
        flash('Product created');
      }
      resetForm();
      fetchProducts();
    } catch(_e) { flash('Error saving'); }
    setLoading(false);
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product and all its keys?')) return;
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE', headers });
    flash('Product deleted');
    fetchProducts();
  };

  // Keys
  const uploadKeys = async () => {
    if (!keyProductId || !keyText.trim()) return;
    setLoading(true);
    const keys = keyText.split('\n').map(k => k.trim()).filter(Boolean);
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST', headers,
        body: JSON.stringify({ product_id: keyProductId, keys }),
      });
      const data = await res.json();
      flash(`${data.inserted || 0} keys uploaded`);
      setKeyText('');
      fetchProducts();
    } catch(_e) { flash('Upload error'); }
    setLoading(false);
  };

  const viewKeys = async (productId) => {
    setViewingKeysFor(productId);
    try {
      const res = await fetch(`/api/admin/keys?product_id=${productId}`, { headers });
      const data = await res.json();
      setProductKeys(Array.isArray(data) ? data : []);
    } catch(_e) { setProductKeys([]); }
  };

  const deleteKey = async (id) => {
    await fetch(`/api/admin/keys?id=${id}`, { method: 'DELETE', headers });
    if (viewingKeysFor) viewKeys(viewingKeysFor);
    fetchProducts();
  };

  // Plans
  const fetchPlans = async (productId) => {
    setManagingPlansFor(productId);
    try {
      const res = await fetch(`/api/admin/plans?product_id=${productId}`, { headers });
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch(_e) { setPlans([]); }
  };

  const addPlan = async () => {
    if (!managingPlansFor || !planForm.name || !planForm.price) return;
    setLoading(true);
    try {
      await fetch('/api/admin/plans', { method: 'POST', headers, body: JSON.stringify({ product_id: managingPlansFor, ...planForm, price: parseFloat(planForm.price) }) });
      setPlanForm({ name: '', name_ru: '', price: '', sort_order: 0 });
      fetchPlans(managingPlansFor);
      flash('Plan added');
    } catch(_e) { flash('Error'); }
    setLoading(false);
  };

  const deletePlan = async (id) => {
    await fetch(`/api/admin/plans?id=${id}`, { method: 'DELETE', headers });
    if (managingPlansFor) fetchPlans(managingPlansFor);
    flash('Plan deleted');
  };

  // User input helpers
  const addUserInput = () => {
    if (!newInput.label) return;
    setForm(f => ({ ...f, user_inputs: [...(f.user_inputs || []), { ...newInput }] }));
    setNewInput({ label: '', label_ru: '', placeholder: '', required: false });
  };

  const removeUserInput = (idx) => {
    setForm(f => ({ ...f, user_inputs: f.user_inputs.filter((_, i) => i !== idx) }));
  };

  // Deliver
  const [deliverEmail, setDeliverEmail] = useState('');
  const [deliverPassword, setDeliverPassword] = useState('');
  const [deliverKey, setDeliverKey] = useState('');
  const [deliverNotes, setDeliverNotes] = useState('');
  const pendingManualOrders = orders.filter(o => o.status === 'paid' && o.delivery_type === 'manual');

  const manualDeliver = async (orderId) => {
    const contentParts = [];
    if (deliverEmail) contentParts.push(`Email: ${deliverEmail}`);
    if (deliverPassword) contentParts.push(`Password: ${deliverPassword}`);
    if (deliverKey) contentParts.push(`Key: ${deliverKey}`);
    if (deliverNotes) contentParts.push(deliverNotes);
    const content = contentParts.join('\n') || deliverContent;
    if (!orderId || !content) { flash('Fill in delivery content'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/deliver', {
        method: 'POST', headers,
        body: JSON.stringify({ order_id: orderId, content }),
      });
      const data = await res.json();
      if (data.success) {
        flash('Delivered!');
        setDeliverOrderId(''); setDeliverContent(''); setDeliverEmail(''); setDeliverPassword(''); setDeliverKey(''); setDeliverNotes('');
        fetchOrders();
      } else flash(data.error || 'Failed');
    } catch(_e) { flash('Error'); }
    setLoading(false);
  };

  // ====== RENDER ======

  if (!authed) {
    return (
      <div style={styles.loginWrap}>
        <div style={styles.loginBox}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>🔐 Admin Login</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>
            Enter your admin password
          </p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ marginBottom: 12 }}
          />
          <button className="btn-primary" onClick={login} style={{ width: '100%' }}>
            Login
          </button>
          {msg && <p style={{ color: 'var(--danger)', marginTop: 8, fontSize: 13 }}>{msg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ width: 32, height: 32, borderRadius: 8, textDecoration: 'none', display: 'block', overflow: 'hidden' }}>
            <img src="/logo.svg" alt="KeyVault" style={{ width: '100%', height: '100%' }} />
          </a>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Admin Dashboard</span>
        </div>
        <button onClick={() => { localStorage.removeItem('kv-admin'); setAuthed(false); }}
          className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>
          Logout
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 200,
          padding: '10px 18px', borderRadius: 8,
          background: '#dcfce7', color: '#166534', fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>{msg}</div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', background: 'var(--bg-card)',
      }}>
        {['products', 'keys', 'orders'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '12px 20px', fontSize: 14, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? 'var(--brand)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
              textTransform: 'capitalize',
            }}>
            {t === 'products' ? '📦 Products' : t === 'keys' ? '🔑 Keys' : '📋 Orders'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>

        {/* ===================== PRODUCTS TAB ===================== */}
        {tab === 'products' && (
          <>
            {/* Form */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                {editProduct ? '✏️ Edit Product' : '➕ New Product'}
              </h3>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Name (EN)*</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Name (RU)</label>
                  <input value={form.name_ru} onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated if empty" />
                </div>
                <div>
                  <label style={styles.label}>Price (USD)*</label>
                  <input type="number" step="0.01" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Image URL</label>
                  <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Category</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">None</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Delivery Type</label>
                  <select value={form.delivery_type} onChange={e => setForm(f => ({ ...f, delivery_type: e.target.value }))}>
                    <option value="auto">Auto (instant key delivery)</option>
                    <option value="manual">Manual (admin delivers)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_featured}
                      onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                    Featured
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                    Active
                  </label>
                </div>
              </div>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Description (EN)</label>
                  <textarea rows={3} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Description (RU)</label>
                  <textarea rows={3} value={form.description_ru}
                    onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))} />
                </div>
              </div>

              {/* User Input Fields Builder */}
              <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <label style={{ ...styles.label, marginBottom: 10, fontSize: 14 }}>📝 Customer Input Fields (e.g. "Username", "Account Email")</label>
                {(form.user_inputs || []).map((inp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{inp.label}</span>
                    {inp.required && <span style={{ fontSize: 11, color: 'var(--danger)' }}>required</span>}
                    <button onClick={() => removeUserInput(idx)} style={{ ...styles.smallBtn, color: '#ef4444' }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Label (EN)" value={newInput.label} onChange={e => setNewInput(p => ({ ...p, label: e.target.value }))} style={{ flex: 1, minWidth: 120 }} />
                  <input type="text" placeholder="Label (RU)" value={newInput.label_ru} onChange={e => setNewInput(p => ({ ...p, label_ru: e.target.value }))} style={{ flex: 1, minWidth: 120 }} />
                  <input type="text" placeholder="Placeholder" value={newInput.placeholder} onChange={e => setNewInput(p => ({ ...p, placeholder: e.target.value }))} style={{ flex: 1, minWidth: 100 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                    <input type="checkbox" checked={newInput.required} onChange={e => setNewInput(p => ({ ...p, required: e.target.checked }))} /> Req
                  </label>
                  <button onClick={addUserInput} disabled={!newInput.label} style={{ ...styles.smallBtn, background: 'var(--brand)', color: 'white', border: 'none' }}>+ Add</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn-primary" onClick={saveProduct} disabled={loading || !form.name || !form.price}>
                  {editProduct ? 'Update' : 'Create'} Product
                </button>
                {editProduct && (
                  <button className="btn-secondary" onClick={resetForm}>Cancel</button>
                )}
              </div>
            </div>

            {/* Product list */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📦 All Products ({products.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Delivery</th>
                      <th style={styles.th}>Stock</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 6,
                              background: 'var(--bg-secondary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden', flexShrink: 0,
                            }}>
                              {p.image_url ? (
                                <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : '🎮'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.categories?.name || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>${Number(p.price).toFixed(2)}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: p.delivery_type === 'auto' ? '#dcfce7' : '#fef3c7',
                            color: p.delivery_type === 'auto' ? '#166534' : '#92400e',
                          }}>
                            {p.delivery_type === 'auto' ? '⚡ Auto' : '🕐 Manual'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 600 }}>{p.stock_count}</span>
                          <span style={{ color: 'var(--text-muted)' }}> / {p.total_keys}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: p.is_active ? '#22c55e' : '#ef4444',
                            display: 'inline-block', marginRight: 6,
                          }} />
                          {p.is_active ? 'Active' : 'Inactive'}
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => startEdit(p)} style={styles.smallBtn}>✏️</button>
                            <button onClick={() => fetchPlans(p.id)} style={styles.smallBtn}>💰</button>
                            <button onClick={() => { setKeyProductId(p.id); setTab('keys'); }} style={styles.smallBtn}>🔑</button>
                            <button onClick={() => deleteProduct(p.id)} style={{ ...styles.smallBtn, color: '#ef4444' }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plans management modal */}
            {managingPlansFor && (
              <>
                <div onClick={() => setManagingPlansFor(null)} style={{
                  position: 'fixed', inset: 0, zIndex: 100,
                  background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                }} />
                <div style={{
                  position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  zIndex: 101, width: '90%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>💰 Price Plans</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{products.find(p => p.id === managingPlansFor)?.name}</p>
                    </div>
                    <button onClick={() => setManagingPlansFor(null)} style={{
                      width: 32, height: 32, borderRadius: '50%', border: 'none',
                      background: 'var(--bg-secondary)', cursor: 'pointer',
                      fontSize: 16, color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>

                  {/* Existing plans */}
                  {plans.length > 0 ? (
                    <div style={{ marginBottom: 20 }}>
                      {plans.map(plan => (
                        <div key={plan.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', marginBottom: 8,
                          background: 'var(--bg-secondary)', borderRadius: 10,
                          border: '1px solid var(--border)',
                        }}>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{plan.name}</span>
                          {plan.name_ru && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({plan.name_ru})</span>}
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>${Number(plan.price).toFixed(2)}</span>
                          <button onClick={() => deletePlan(plan.id)} style={{ ...styles.smallBtn, color: '#ef4444' }}>🗑</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                      No plans yet. Add your first plan below.
                    </div>
                  )}

                  {/* Add new plan form */}
                  <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Add New Plan</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" placeholder="Plan name (e.g. 1 Month)" value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} style={{ flex: 1 }} />
                        <input type="text" placeholder="Name (RU)" value={planForm.name_ru} onChange={e => setPlanForm(p => ({ ...p, name_ru: e.target.value }))} style={{ flex: 1 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" step="0.01" placeholder="Price (USD)" value={planForm.price} onChange={e => setPlanForm(p => ({ ...p, price: e.target.value }))} style={{ flex: 1 }} />
                        <button onClick={addPlan} disabled={!planForm.name || !planForm.price} className="btn-primary" style={{ padding: '10px 20px', fontSize: 13, flexShrink: 0 }}>+ Add Plan</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ===================== KEYS TAB ===================== */}
        {tab === 'keys' && (
          <>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🔑 Upload Keys</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>Select Product</label>
                <select value={keyProductId} onChange={e => setKeyProductId(e.target.value)}>
                  <option value="">Choose a product...</option>
                  {products.filter(p => p.delivery_type === 'auto').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock: {p.stock_count})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={styles.label}>Keys (one per line)</label>
                <textarea
                  rows={8}
                  value={keyText}
                  onChange={e => setKeyText(e.target.value)}
                  placeholder={"XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY\nZZZZZ-ZZZZZ-ZZZZZ"}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn-primary" onClick={uploadKeys}
                  disabled={loading || !keyProductId || !keyText.trim()}>
                  Upload {keyText.split('\n').filter(l => l.trim()).length} keys
                </button>
                {keyProductId && (
                  <button className="btn-secondary" onClick={() => viewKeys(keyProductId)}>
                    View existing keys
                  </button>
                )}
              </div>
            </div>

            {/* View keys */}
            {viewingKeysFor && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  Keys for: {products.find(p => p.id === viewingKeysFor)?.name || 'Product'}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14 }}>
                    {' '}({productKeys.length} total)
                  </span>
                </h3>
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Key</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productKeys.map(k => (
                        <tr key={k.id}>
                          <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12 }}>
                            {k.key_content.length > 40 ? k.key_content.slice(0, 40) + '...' : k.key_content}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                              background: k.is_sold ? '#fee2e2' : '#dcfce7',
                              color: k.is_sold ? '#991b1b' : '#166534',
                            }}>
                              {k.is_sold ? 'Sold' : 'Available'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, fontSize: 12 }}>
                            {new Date(k.created_at).toLocaleDateString()}
                          </td>
                          <td style={styles.td}>
                            {!k.is_sold && (
                              <button onClick={() => deleteKey(k.id)} style={styles.smallBtn}>🗑</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===================== ORDERS TAB ===================== */}
        {tab === 'orders' && (
          <>
            {/* Pending manual delivery orders */}
            {pendingManualOrders.length > 0 && (
              <div style={{ ...styles.card, border: '2px solid var(--warning)' }}>
                <h3 style={styles.cardTitle}>📬 Pending Manual Delivery ({pendingManualOrders.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingManualOrders.map(o => (
                    <div key={o.id} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{o.products?.name || 'Unknown'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {o.buyer_email} · ${Number(o.amount).toFixed(2)} · {new Date(o.created_at).toLocaleDateString()}
                            {o.plan_name && <span style={{ color: 'var(--brand)' }}> · Plan: {o.plan_name}</span>}
                          </div>
                          {/* Show user input data */}
                          {o.user_input_data && Object.keys(o.user_input_data).length > 0 && (
                            <div style={{ marginTop: 6, fontSize: 12 }}>
                              {Object.entries(o.user_input_data).map(([k, v]) => (
                                <span key={k} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: 'var(--brand-light)', color: 'var(--brand)', marginRight: 6, fontWeight: 500 }}>
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{o.id.slice(0, 8)}</span>
                      </div>
                      {deliverOrderId === o.id ? (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          <div style={styles.grid2}>
                            <div><label style={styles.label}>Email (login)</label><input type="text" placeholder="user@example.com" value={deliverEmail} onChange={e => setDeliverEmail(e.target.value)} /></div>
                            <div><label style={styles.label}>Password</label><input type="text" placeholder="password123" value={deliverPassword} onChange={e => setDeliverPassword(e.target.value)} /></div>
                          </div>
                          <div style={{ marginTop: 8 }}><label style={styles.label}>Key / Code</label><input type="text" placeholder="XXXXX-XXXXX-XXXXX" value={deliverKey} onChange={e => setDeliverKey(e.target.value)} /></div>
                          <div style={{ marginTop: 8 }}><label style={styles.label}>Additional notes</label><textarea rows={2} placeholder="Any extra instructions..." value={deliverNotes} onChange={e => setDeliverNotes(e.target.value)} /></div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button className="btn-primary" onClick={() => manualDeliver(o.id)} disabled={loading || (!deliverEmail && !deliverPassword && !deliverKey && !deliverNotes)} style={{ padding: '8px 16px', fontSize: 13 }}>✓ Deliver</button>
                            <button className="btn-secondary" onClick={() => { setDeliverOrderId(''); setDeliverEmail(''); setDeliverPassword(''); setDeliverKey(''); setDeliverNotes(''); }} style={{ padding: '8px 16px', fontSize: 13 }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setDeliverOrderId(o.id)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>📬 Deliver Now</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['', 'pending', 'paid', 'delivered', 'cancelled'].map(s => (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className={`chip ${orderFilter === s ? 'active' : ''}`}>
                  {s || 'All'}
                </button>
              ))}
            </div>

            {/* Orders table */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📋 Orders ({orders.length})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order</th>
                      <th style={styles.th}>Product</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Amount</th>
                      <th style={styles.th}>Method</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 11 }}>
                          {o.id.slice(0, 8)}
                        </td>
                        <td style={{ ...styles.td, fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.products?.name || '—'}
                        </td>
                        <td style={{ ...styles.td, fontSize: 12 }}>{o.buyer_email}</td>
                        <td style={styles.td}>${Number(o.amount).toFixed(2)}</td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: o.payment_method === 'stripe' ? '#e0e7ff' : '#fef3c7',
                            color: o.payment_method === 'stripe' ? '#3730a3' : '#92400e',
                          }}>
                            {o.payment_method === 'stripe' ? '💳 Card' : '₿ Crypto'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: o.status === 'delivered' ? '#dcfce7' : o.status === 'paid' ? '#e0e7ff' : o.status === 'pending' ? '#fef3c7' : '#fee2e2',
                            color: o.status === 'delivered' ? '#166534' : o.status === 'paid' ? '#3730a3' : o.status === 'pending' ? '#92400e' : '#991b1b',
                          }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ ...styles.td, fontSize: 12 }}>
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                        <td style={styles.td}>
                          {o.status === 'paid' && o.delivery_type === 'manual' && (
                            <button onClick={() => { setDeliverOrderId(o.id); window.scrollTo(0, 0); }}
                              style={styles.smallBtn}>📬</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  loginWrap: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', padding: 20,
  },
  loginBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 32, maxWidth: 380, width: '100%',
  },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 20, marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16, fontWeight: 700, margin: '0 0 16px',
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: 4,
  },
  grid2: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12,
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 14,
  },
  th: {
    textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600,
    color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  td: {
    padding: '10px 12px', borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  },
  smallBtn: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 13,
  },
};
