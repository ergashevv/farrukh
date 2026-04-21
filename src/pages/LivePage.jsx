import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Renderer } from '../components/Renderer/Renderer';

const DEFAULT_DOC_TITLE = 'Mini Site Builder + QR Publisher';

export const LivePage = () => {
  const { slug: slugRaw } = useParams();
  const slug = (slugRaw || '').trim();
  const slugUpper = slug.toUpperCase();

  const [data, setData] = useState(null);
  const [locked, setLocked] = useState(false);
  const [teaser, setTeaser] = useState(null);
  const [expired, setExpired] = useState(false);
  const [unlockPass, setUnlockPass] = useState('');
  const [unlockErr, setUnlockErr] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/get-site?slug=${encodeURIComponent(slugUpper)}`);
        const json = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.status === 410) {
          setExpired(true);
          setLocked(false);
          setTeaser(null);
          setData(null);
          return;
        }

        if (!response.ok) {
          setData(null);
          setLocked(false);
          setTeaser(null);
          setExpired(false);
          return;
        }

        if (json.locked) {
          setLocked(true);
          setTeaser(json.teaser || {});
          setData(null);
          setExpired(false);
          return;
        }

        setLocked(false);
        setTeaser(null);
        setExpired(false);
        setData(json);
        try {
          localStorage.setItem(`published_${slugUpper}`, JSON.stringify(json));
        } catch {
          /* quota */
        }
      } catch {
        if (!cancelled) {
          setData(null);
          setLocked(false);
          setTeaser(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, slugUpper]);

  useEffect(() => {
    if (!slugUpper || !data) return;
    const k = `view_tracked_${slugUpper}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {
      /* private mode */
    }
    fetch('/api/site-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slugUpper, event: 'view' }),
    }).catch(() => {});
  }, [slugUpper, data]);

  useEffect(() => {
    if (!data) return;
    const title = (data.seo?.pageTitle || data.content?.title || slug || '').trim() || DEFAULT_DOC_TITLE;
    const desc = (data.seo?.description || data.content?.description || '').trim();

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    const setOg = (prop, content) => {
      if (!content) return;
      let m = document.querySelector(`meta[property="${prop}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('property', prop);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    };

    setOg('og:title', (data.seo?.pageTitle || data.content?.title || '').trim());
    setOg('og:description', desc);
    setOg('og:image', (data.seo?.ogImage || '').trim());
    setOg('og:type', 'website');

    return () => {
      document.title = DEFAULT_DOC_TITLE;
    };
  }, [data, slug]);

  const submitUnlock = async (e) => {
    e.preventDefault();
    setUnlockErr('');
    setUnlocking(true);
    try {
      const res = await fetch('/api/unlock-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slugUpper, password: unlockPass }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUnlockErr(j.error || 'Xato');
        return;
      }
      setData(j);
      setLocked(false);
      setTeaser(null);
      try {
        localStorage.setItem(`published_${slugUpper}`, JSON.stringify(j));
      } catch {
        /* ignore */
      }
    } finally {
      setUnlocking(false);
    }
  };

  if (expired) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Havola muddati tugagan</h2>
        <p style={{ color: '#71717a', textAlign: 'center' }}>Bu sahifa endi mavjud emas.</p>
        <Link to="/" style={{ marginTop: '1rem', color: '#0ea5e9' }}>Bosh sahifa</Link>
      </div>
    );
  }

  if (locked && teaser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: '1.5rem', background: '#f4f4f5' }}>
        {teaser.avatar && (
          <img src={teaser.avatar} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />
        )}
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', textAlign: 'center' }}>{teaser.title || 'Maxfiy sahifa'}</h1>
        {teaser.subtitle && <p style={{ color: '#71717a', marginTop: 0, textAlign: 'center' }}>{teaser.subtitle}</p>}
        <form onSubmit={submitUnlock} style={{ marginTop: '1.5rem', width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="password"
            placeholder="Parol"
            value={unlockPass}
            onChange={(e) => setUnlockPass(e.target.value)}
            autoComplete="current-password"
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #e4e4e7', fontFamily: 'inherit' }}
          />
          {unlockErr && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem' }}>{unlockErr}</p>}
          <button
            type="submit"
            disabled={unlocking}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: '#18181b',
              color: '#fff',
              fontWeight: 600,
              cursor: unlocking ? 'wait' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {unlocking ? 'Tekshirilmoqda...' : 'Kirish'}
          </button>
        </form>
        <Link to="/" style={{ marginTop: '2rem', color: '#0ea5e9', fontSize: '0.875rem' }}>Bosh sahifa</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Sahifa topilmadi</h2>
        <p style={{ color: '#71717a', textAlign: 'center' }}>Sayt o‘chirilgan yoki havola noto‘g‘ri.</p>
        <Link to="/" style={{ marginTop: '1rem', color: '#0ea5e9' }}>Bosh sahifa</Link>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Renderer data={data} siteSlug={slugUpper} />
    </div>
  );
};
