import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Plus, Pencil, Trash2, LogOut, ExternalLink } from 'lucide-react';
import { getStoredAuth, clearAuth } from '../auth';
import { SitePreviewThumb } from '../components/SitePreviewThumb';

const MAX = 5;

export const Dashboard = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const auth = getStoredAuth();

  useEffect(() => {
    if (!auth?.token) {
      navigate('/login', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setErr('');
      try {
        const res = await fetch('/api/my-sites', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Xato');
        if (!cancelled) setSites(j.sites || []);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Yuklash muvaffaqiyatsiz');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth?.token, navigate]);

  const handleDelete = async (slug) => {
    if (!window.confirm(`"${slug}" o‘chirilsinmi?`)) return;
    const a = getStoredAuth();
    if (!a?.token) return;
    try {
      const res = await fetch('/api/site-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${a.token}`,
        },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'O‘chirish muvaffaqiyatsiz');
      }
      setSites((prev) => prev.filter((s) => s.slug !== slug));
    } catch (e) {
      alert(e.message);
    }
  };

  const logout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  if (!auth?.token) return null;

  const canCreate = sites.length < MAX;

  return (
    <div className="app-container" style={{ flexDirection: 'column', height: 'auto', minHeight: '100vh', overflow: 'auto' }}>
      <header
        className="editor-header"
        style={{ width: '100%', maxWidth: '720px', margin: '0 auto', border: 'none' }}
      >
        <div className="flex items-center gap-2">
          <QrCode size={24} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Mening saytlarim</h1>
        </div>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          <LogOut size={16} /> Chiqish
        </button>
      </header>

      <main style={{ width: '100%', maxWidth: '720px', margin: '0 auto', padding: '1.5rem' }}>
        <div className="flex justify-between items-center gap-4" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Saqlangan: {sites.length} / {MAX}. Tahrirlash yoki o‘chirish mumkin.
          </p>
          {canCreate ? (
            <Link to="/builder" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={16} /> Yangi sayt
            </Link>
          ) : (
            <span className="btn btn-secondary" style={{ opacity: 0.7, cursor: 'not-allowed' }} title="Limit">
              Limit ({MAX})
            </span>
          )}
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</p>}
        {err && <p style={{ color: '#dc2626' }}>{err}</p>}

        {!loading && sites.length === 0 && !err && (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 1rem' }}>Hali sayt yo‘q.</p>
            <Link to="/builder" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Birinchi saytni yaratish
            </Link>
          </div>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sites.map((s) => (
            <li key={s.slug} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div
                className="flex justify-between items-center gap-3"
                style={{ flexWrap: 'wrap', alignItems: 'stretch' }}
              >
                <div className="flex gap-3 items-center" style={{ flex: 1, minWidth: 0 }}>
                  <SitePreviewThumb preview={s.preview} title={s.title} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      /{s.slug}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap', flexShrink: 0 }}>
                  <a
                    href={`/${s.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> Ko‘rish
                  </a>
                  <Link
                    to={`/builder?slug=${encodeURIComponent(s.slug)}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', textDecoration: 'none' }}
                  >
                    <Pencil size={14} /> Tahrirlash
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', color: '#dc2626', borderColor: '#fecaca' }}
                    onClick={() => handleDelete(s.slug)}
                  >
                    <Trash2 size={14} /> O‘chirish
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};
