import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { setStoredAuth, getStoredAuth } from '../auth';

export const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth-login' : '/api/auth-register';
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || 'Xato');
        return;
      }
      setStoredAuth(j.token, j.user);
      navigate('/', { replace: true });
    } catch {
      setError('Tarmoq xatosi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getStoredAuth()) navigate('/', { replace: true });
  }, [navigate]);

  if (getStoredAuth()) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg-primary)',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
          <QrCode size={28} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Mini Site</h1>
        </div>

        <div className="flex gap-2" style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`btn flex-1 ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('login')}
          >
            Kirish
          </button>
          <button
            type="button"
            className={`btn flex-1 ${mode === 'signup' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('signup')}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        <form onSubmit={submit} className="flex-col gap-3">
          <div>
            <span className="label">Login</span>
            <input
              className="input-field w-full mt-2"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="masalan: ali"
            />
          </div>
          <div>
            <span className="label">Parol</span>
            <input
              type="password"
              className="input-field w-full mt-2"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Kirish' : 'Hisob yaratish'}
          </button>
        </form>
      </div>
    </div>
  );
};
