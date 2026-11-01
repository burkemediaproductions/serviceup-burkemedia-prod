import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function MenusPage() {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/menus')
      .then((res) => setItems(Array.isArray(res) ? res : res?.data || []))
      .catch((err) => setError(err.message || 'Failed to load menus'))
      .finally(() => setLoading(false));
  }, []);

  async function add() {
    if (!label.trim()) return;
    try {
      setSaving(true);
      setError('');
      const created = await api.post('/api/menus', { label: label.trim() });
      setItems((i) => [...i, created]);
      setLabel('');
    } catch (err) {
      setError(err.message || 'Failed to create menu');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="su-grid">
      <div className="su-card">
        <h2>Menus</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="su-input"
            placeholder="Label…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
            }}
          />
          <button className="su-btn primary" onClick={add} disabled={saving || !label.trim()}>
            {saving ? 'Adding…' : 'Add New'}
          </button>
        </div>
        {error && <p className="su-text-sm" style={{ color: 'var(--su-danger)' }}>{error}</p>}
      </div>
      <div className="su-card">
        <ul>
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid var(--su-border)',
              }}
            >
              {it.label}
            </li>
          ))}
          {!loading && items.length === 0 && <li>No menus yet.</li>}
          {loading && <li>Loading menus…</li>}
        </ul>
      </div>
    </div>
  );
}
