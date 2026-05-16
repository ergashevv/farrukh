import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ExternalLink, QrCode, Trash2, Calendar, Link as LinkIcon, Image as ImageIcon, FileText, Wifi, Phone, Mail, MapPin } from 'lucide-react';
import { getStoredAuth, clearAuth } from '../auth';

export const History = () => {
  const navigate = useNavigate();
  const [converts, setConverts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth?.token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/my-sites', {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        if (res.status === 401) {
          clearAuth();
          navigate('/login');
          return;
        }
        const data = await res.json();
        setConverts(data.converts || []);
      } catch (err) {
        setError('Ma’lumotlarni yuklashda xato yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'url': return <LinkIcon size={18} />;
      case 'image': return <ImageIcon size={18} />;
      case 'pdf': return <FileText size={18} />;
      case 'wifi': return <Wifi size={18} />;
      case 'vcard': return <Phone size={18} />;
      case 'email': return <Mail size={18} />;
      case 'maps': return <MapPin size={18} />;
      default: return <QrCode size={18} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ color: '#64748b', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={24} color="#f59e0b" />
              QR Kodlar Tarixi
            </h1>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Yuklanmoqda...</div>
        ) : error ? (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>
        ) : converts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
            <QrCode size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#64748b' }}>Hali hech qanday QR kod yaratilmagan</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Konvertatsiya bo‘limidan birinchi QR kodni yarating</p>
            <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Dashboardga qaytish</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {converts.map((c) => (
              <div key={c.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                    <QRCodeSVG value={c.result_url} size={60} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                      {getTypeIcon(c.type)}
                      {c.type}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.content}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <Calendar size={14} />
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a 
                      href={c.result_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      title="Havolani ochish"
                    >
                      <ExternalLink size={14} /> Ochish
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
