import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Plus, Pencil, Trash2, LogOut, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getStoredAuth, clearAuth } from '../auth';
import { SitePreviewThumb } from '../components/SitePreviewThumb';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  const t = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return v.uz || v.en || v.ru || '';
  };

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

  return (
    <div className="app-container" style={{ flexDirection: 'column', height: 'auto', minHeight: '100vh', overflow: 'auto' }}>
      <header
        className="editor-header"
        style={{ width: '100%', maxWidth: '720px', margin: '0 auto', border: 'none' }}
      >
        <div className="flex items-center gap-2">
          <QrCode size={24} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Barcha saytlar</h1>
        </div>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          <LogOut size={16} /> Chiqish
        </button>
      </header>

      <main style={{ width: '100%', maxWidth: '720px', margin: '0 auto', padding: '1.5rem' }}>
        <div className="flex justify-between items-center gap-4" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Ro‘yxatdagi saytlar: {sites.length}. Tahrirlash yoki o‘chirish mumkin.
          </p>
          <div className="flex gap-2">
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setIsConvertOpen(true)}
            >
              <QrCode size={16} /> Konvertatsiya
            </button>
            <Link to="/builder?new=1" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={16} /> Yangi sayt
            </Link>
          </div>
        </div>

        {isConvertOpen && <ConvertModal onClose={() => setIsConvertOpen(false)} />}

        {loading && <p style={{ color: 'var(--text-muted)' }}>Yuklanmoqda...</p>}
        {err && <p style={{ color: '#dc2626' }}>{err}</p>}

        {!loading && sites.length === 0 && !err && (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 1rem' }}>Hali sayt yo‘q.</p>
            <Link to="/builder?new=1" className="btn btn-primary" style={{ textDecoration: 'none' }}>
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
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t(s.title)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      /{s.slug}
                      {typeof s.viewCount === 'number' ? (
                        <span style={{ marginLeft: '0.5rem' }}>· Ko‘rishlar: {s.viewCount}</span>
                      ) : null}
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

const ConvertModal = ({ onClose }) => {
  const [type, setType] = useState('url'); // 'url' | 'file'
  const [inputUrl, setInputUrl] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        alert('Fayl hajmi 5MB dan oshmasligi kerak');
        return;
      }
      setFile(f);
      setResultUrl('');
    }
  };

  const handleConvert = async () => {
    setError('');
    if (type === 'url') {
      if (!inputUrl.trim()) {
        setError('Havolani kiriting');
        return;
      }
      setResultUrl(inputUrl.trim());
    } else {
      if (!file) {
        setError('Faylni tanlang');
        return;
      }
      setUploading(true);
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const dataUrl = reader.result;
          const auth = getStoredAuth();
          const res = await fetch('/api/upload-blob', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${auth?.token}`,
            },
            body: JSON.stringify({ dataUrl, kind: 'convert' }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || 'Yuklashda xato');
          setResultUrl(j.url);
          setUploading(false);
        };
        reader.onerror = () => {
          throw new Error('Faylni o‘qishda xato');
        };
      } catch (e) {
        setError(e.message);
        setUploading(false);
      }
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-result-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qr-code.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '1.5rem', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
        >
          ×
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem' }}>QR kodga o‘tkazish</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f4f4f5', padding: '0.25rem', borderRadius: '0.5rem' }}>
          <button 
            className={`btn ${type === 'url' ? 'btn-primary' : ''}`}
            style={{ flex: 1, border: 'none', background: type === 'url' ? '' : 'transparent', color: type === 'url' ? '' : 'var(--text-secondary)' }}
            onClick={() => { setType('url'); setResultUrl(''); }}
          >
            Havola
          </button>
          <button 
            className={`btn ${type === 'file' ? 'btn-primary' : ''}`}
            style={{ flex: 1, border: 'none', background: type === 'file' ? '' : 'transparent', color: type === 'file' ? '' : 'var(--text-secondary)' }}
            onClick={() => { setType('file'); setResultUrl(''); }}
          >
            Fayl
          </button>
        </div>

        {type === 'url' ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Veb-sayt manzili (URL)</label>
            <input 
              type="text" 
              className="input" 
              placeholder="https://example.com" 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Fayl yuklash (JPEG, PNG, WebP)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              style={{ width: '100%', fontSize: '0.875rem' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Maksimal hajm: 5MB</p>
          </div>
        )}

        {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginBottom: '1.5rem' }}
          onClick={handleConvert}
          disabled={uploading}
        >
          {uploading ? 'Yuklanmoqda...' : 'QR kod yaratish'}
        </button>

        {resultUrl && (
          <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem' }}>
            <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
              <QRCodeSVG id="qr-result-svg" value={resultUrl} size={200} />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', wordBreak: 'break-all' }}>
              {resultUrl}
            </div>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={downloadQR}>
              QR kodni yuklab olish (.png)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
