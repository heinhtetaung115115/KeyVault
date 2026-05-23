'use client';
import { useStore } from './StoreContext';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;

  const colors = {
    success: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
    error: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    info: { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
  };
  const c = colors[toast.type] || colors.success;

  return (
    <div className="toast-enter" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      padding: '12px 20px', borderRadius: 10,
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      fontSize: 14, fontWeight: 500,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    }}>
      {toast.type === 'success' && '✓ '}
      {toast.type === 'error' && '✕ '}
      {toast.message}
    </div>
  );
}
