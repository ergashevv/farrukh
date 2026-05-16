import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  QrCode, Plus, Pencil, Trash2, LogOut, ExternalLink, Link as LinkIcon, Image as ImageIcon, 
  FileText, Wifi, AlignLeft, ChevronLeft, MessageCircle, Camera, Video, MapPin, Smartphone, 
  ArrowRight, Send, Facebook, Music, Linkedin, Twitter, PhoneCall, MessageSquare, Mail, 
  Layout, Volume2, Coins, Calendar, User, ShoppingBag
} from 'lucide-react';
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
  const [step, setStep] = useState('grid'); // 'grid' | 'input' | 'result'
  const [mode, setMode] = useState(null); // 'url' | 'image' | 'pdf' | 'wifi' | 'text'
  const [inputUrl, setInputUrl] = useState('');
  const [inputText, setInputText] = useState('');
  const [vcard, setVcard] = useState({ firstName: '', lastName: '', phone: '', email: '', org: '', job: '', url: '' });
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [smsData, setSmsData] = useState({ phone: '', message: '' });
  const [crypto, setCrypto] = useState({ currency: 'bitcoin', address: '', amount: '' });
  const [event, setEvent] = useState({ title: '', location: '', start: '', end: '', desc: '' });
  const [wifi, setWifi] = useState({ ssid: '', password: '', security: 'WPA' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#ffffff',
    fontSize: '0.95rem',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  };

  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  const MODES = [
    { id: 'url', label: 'Havola / URL', icon: <LinkIcon size={20} />, color: '#3b82f6', desc: 'Veb-sayt yoki ijtimoiy tarmoq linklari' },
    { id: 'telegram', label: 'Telegram', icon: <Send size={20} />, color: '#0088cc', desc: 'Profil yoki guruh havolasi' },
    { id: 'instagram', label: 'Instagram', icon: <Camera size={20} />, color: '#d946ef', desc: 'Profil yoki postga havola' },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={20} />, color: '#22c55e', desc: 'To‘g‘ridan-to‘g‘ri chatga o‘tish' },
    { id: 'facebook', label: 'Facebook', icon: <Facebook size={20} />, color: '#1877f2', desc: 'Sahifa yoki profil' },
    { id: 'tiktok', label: 'TikTok', icon: <Music size={20} />, color: '#000000', desc: 'Video yoki profil' },
    { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={20} />, color: '#0a66c2', desc: 'Professional profil' },
    { id: 'twitter', label: 'Twitter (X)', icon: <Twitter size={20} />, color: '#000000', desc: 'X profili yoki post' },
    { id: 'youtube', label: 'YouTube', icon: <Video size={20} />, color: '#ff0000', desc: 'Video yoki kanal havolasi' },
    { id: 'vcard', label: 'Vizitka (vCard)', icon: <User size={20} />, color: '#ec4899', desc: 'Kontakt ma’lumotlarini saqlash' },
    { id: 'call', label: 'Telefon', icon: <PhoneCall size={20} />, color: '#4ade80', desc: 'Raqamga qo‘ng‘iroq qilish' },
    { id: 'sms', label: 'SMS Xabar', icon: <MessageSquare size={20} />, color: '#60a5fa', desc: 'Oldindan yozilgan SMS yuborish' },
    { id: 'email', label: 'E-mail', icon: <Mail size={20} />, color: '#ea4335', desc: 'Xat yuborish (Mavzu va matn)' },
    { id: 'pdf', label: 'PDF Fayl', icon: <FileText size={20} />, color: '#ef4444', desc: 'Hujjatlarni QR kod orqali ulashish' },
    { id: 'image', label: 'Tasvir (Rasm)', icon: <ImageIcon size={20} />, color: '#ec4899', desc: 'JPEG, PNG yoki WebP formatidagi rasmlar' },
    { id: 'audio', label: 'Audio / MP3', icon: <Volume2 size={20} />, color: '#8b5cf6', desc: 'Musiqa faylini yuklash' },
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi size={20} />, color: '#10b981', desc: 'Tarmoqqa parolsiz ulanish imkoniyati' },
    { id: 'text', label: 'Matn', icon: <AlignLeft size={20} />, color: '#6b7280', desc: 'Xabar, eslatma yoki oddiy matn' },
    { id: 'maps', label: 'Xarita (Maps)', icon: <MapPin size={20} />, color: '#f59e0b', desc: 'Manzil yoki joylashuv koordinatalari' },
    { id: 'appstore', label: 'Ilovalar', icon: <ShoppingBag size={20} />, color: '#0ea5e9', desc: 'Play Market yoki App Store' },
    { id: 'spotify', label: 'Spotify', icon: <Layout size={20} />, color: '#1db954', desc: 'Musiqa yoki pleylist' },
    { id: 'crypto', label: 'Kripto', icon: <Coins size={20} />, color: '#f7931a', desc: 'BTC, ETH to‘lovlari' },
    { id: 'calendar', label: 'Tadbir', icon: <Calendar size={20} />, color: '#3b82f6', desc: 'Tadbirni kalendarga saqlash' },
  ];

  const currentMode = MODES.find(m => m.id === mode);

  const handleInputFocus = (e) => {
    e.target.style.borderColor = currentMode?.color || '#f59e0b';
    e.target.style.boxShadow = `0 0 0 4px ${currentMode?.color || '#f59e0b'}15`;
    e.target.style.transform = 'translateY(-1px)';
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#e2e8f0';
    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    e.target.style.transform = 'translateY(0)';
  };

  const handleModeSelect = (m) => {
    setMode(m);
    setStep('input');
    setError('');
    setResultUrl('');
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      const isPdf = f.type === 'application/pdf';
      const isImg = f.type.startsWith('image/');
      
      if (mode === 'pdf' && !isPdf) {
        alert('Faqat PDF fayl tanlang');
        return;
      }
      if (mode === 'image' && !isImg) {
        alert('Faqat rasm tanlang');
        return;
      }

      if (f.size > 5 * 1024 * 1024) {
        alert('Fayl hajmi 5MB dan oshmasligi kerak');
        return;
      }
      setFile(f);
    }
  };

  const handleConvert = async () => {
    setError('');
    let finalContent = '';

    if (mode === 'url' || mode === 'youtube' || mode === 'appstore') {
      if (!inputUrl.trim()) return setError('Havolani kiriting');
      finalContent = inputUrl.trim();
      if (!/^https?:\/\//i.test(finalContent)) finalContent = 'https://' + finalContent;
    } else if (mode === 'whatsapp') {
      if (!inputUrl.trim()) return setError('Telefon raqamini kiriting');
      const num = inputUrl.replace(/\D/g, '');
      finalContent = `https://wa.me/${num}`;
    } else if (mode === 'instagram') {
      if (!inputUrl.trim()) return setError('Username kiriting');
      const user = inputUrl.replace('@', '').trim();
      finalContent = `https://instagram.com/${user}`;
    } else if (mode === 'maps') {
      if (!inputUrl.trim()) return setError('Manzilni kiriting');
      finalContent = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputUrl.trim())}`;
    } else if (mode === 'text') {
      if (!inputText.trim()) return setError('Matn kiriting');
      finalContent = inputText.trim();
    } else if (mode === 'telegram') {
      if (!inputUrl.trim()) return setError('Username kiriting');
      const user = inputUrl.replace('@', '').replace('https://t.me/', '').trim();
      finalContent = `https://t.me/${user}`;
    } else if (mode === 'facebook') {
      if (!inputUrl.trim()) return setError('Link yoki username kiriting');
      finalContent = inputUrl.startsWith('http') ? inputUrl.trim() : `https://facebook.com/${inputUrl.trim()}`;
    } else if (mode === 'tiktok') {
      if (!inputUrl.trim()) return setError('Username kiriting');
      const user = inputUrl.replace('@', '').trim();
      finalContent = `https://tiktok.com/@${user}`;
    } else if (mode === 'linkedin') {
      if (!inputUrl.trim()) return setError('Profile link kiriting');
      finalContent = inputUrl.startsWith('http') ? inputUrl.trim() : `https://linkedin.com/in/${inputUrl.trim()}`;
    } else if (mode === 'twitter') {
      if (!inputUrl.trim()) return setError('Username kiriting');
      const user = inputUrl.replace('@', '').trim();
      finalContent = `https://twitter.com/${user}`;
    } else if (mode === 'call') {
      if (!inputUrl.trim()) return setError('Telefon raqam kiriting');
      finalContent = `tel:${inputUrl.replace(/\s/g, '')}`;
    } else if (mode === 'sms') {
      if (!smsData.phone.trim()) return setError('Raqam kiriting');
      finalContent = `smsto:${smsData.phone.replace(/\s/g, '')}:${smsData.message}`;
    } else if (mode === 'email') {
      if (!emailData.to.trim()) return setError('Email manzilingizni kiriting');
      finalContent = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    } else if (mode === 'vcard') {
      if (!vcard.firstName.trim()) return setError('Ism kiriting');
      finalContent = `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName};${vcard.firstName};;;\nFN:${vcard.firstName} ${vcard.lastName}\nORG:${vcard.org}\nTITLE:${vcard.job}\nTEL;TYPE=CELL:${vcard.phone}\nEMAIL;TYPE=INTERNET:${vcard.email}\nURL:${vcard.url}\nEND:VCARD`;
    } else if (mode === 'crypto') {
      if (!crypto.address.trim()) return setError('Hamyon manzilini kiriting');
      finalContent = `${crypto.currency}:${crypto.address}${crypto.amount ? `?amount=${crypto.amount}` : ''}`;
    } else if (mode === 'calendar') {
      if (!event.title.trim()) return setError('Tadbir nomini kiriting');
      const s = event.start.replace(/[-:]/g, '');
      const e = event.end.replace(/[-:]/g, '');
      finalContent = `BEGIN:VEVENT\nSUMMARY:${event.title}\nLOCATION:${event.location}\nDESCRIPTION:${event.desc}\nDTSTART:${s}\nDTEND:${e}\nEND:VEVENT`;
    } else if (mode === 'spotify') {
      if (!inputUrl.trim()) return setError('Spotify linkini kiriting');
      finalContent = inputUrl.trim();
    } else if (mode === 'audio') {
      if (!file) return setError('Audio fayl tanlang');
      // Audio handleUploadBlob orqali yuklanadi
      setUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const auth = getStoredAuth();
        const res = await fetch('/api/upload-blob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.token}` },
          body: JSON.stringify({ dataUrl: reader.result, kind: 'convert' }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Yuklashda xato');
        setResultUrl(j.url);
        setStep('result');
        setUploading(false);
      };
      return;
    } else if (mode === 'wifi') {
      if (!wifi.ssid.trim()) return setError('Tarmoq nomini kiriting');
      finalContent = `WIFI:T:${wifi.security};S:${wifi.ssid};P:${wifi.password};;`;
    } else if (mode === 'image') {
      if (!file) return setError('Rasm tanlang');
      setUploading(true);
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const auth = getStoredAuth();
          const res = await fetch('/api/upload-blob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.token}` },
            body: JSON.stringify({ dataUrl: reader.result, kind: 'convert' }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || 'Yuklashda xato');
          setResultUrl(j.url);
          setStep('result');
          setUploading(false);
        };
      } catch (e) {
        setError(e.message);
        setUploading(false);
      }
      return;
    } else if (mode === 'pdf') {
      if (!file) return setError('PDF fayl tanlang');
      setUploading(true);
      try {
        // PDF yuklash uchun /api/upload-pdf endpointini ishlatamiz.
        // Bu erda handleUpload (client) ishlatish o'rniga, oddiy fetch bilan handleUploadPdf ga yuboramiz.
        // Lekin handleUploadPdf vercel/blob handleUpload ni kutadi. 
        // Shuning uchun client-side upload ishlatgan ma'qul.
        
        // Agar handleUpload import qilinmagan bo'lsa, oddiyroq yo'l:
        // Hozircha handlers.js dagi handleUploadPdf multipart/form-data emas, balki blob.generate-client-token ni kutadi.
        // Shuning uchun oddiyroq yo'l: handleUploadBlob ni PDF uchun ham ochib qo'yishimiz mumkin.
        // Lekin hozircha faqat image ni qoldiramiz yoki PDF ni ham shunday yuboramiz.
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const auth = getStoredAuth();
          const res = await fetch('/api/upload-blob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.token}` },
            body: JSON.stringify({ dataUrl: reader.result, kind: 'convert' }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || 'Yuklashda xato. (PDF format ruxsat etilmagan bo‘lishi mumkin)');
          setResultUrl(j.url);
          setStep('result');
          setUploading(false);
        };
      } catch (e) {
        setError(e.message);
        setUploading(false);
      }
      return;
    }

    if (finalContent) {
      setResultUrl(finalContent);
      setStep('result');
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
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-${mode || 'code'}.png`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const renderContent = () => {
    if (step === 'grid') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeSelect(m.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', background: 'white', border: '1px solid #e4e4e7',
                borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.boxShadow = `0 4px 12px ${m.color}15`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: m.color, background: `${m.color}10`, padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#18181b' }}>{m.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '1px' }}>{m.desc}</div>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: '#a1a1aa' }} />
            </button>
          ))}
        </div>
      );
    }

    if (step === 'input') {
      const currentMode = MODES.find(m => m.id === mode);
      return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <button 
            onClick={() => setStep('grid')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 }}
          >
            <ChevronLeft size={16} /> Orqaga
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: `${currentMode?.color}08`, borderRadius: '1rem' }}>
            <div style={{ color: currentMode?.color, background: `${currentMode?.color}15`, padding: '0.875rem', borderRadius: '50%', display: 'flex' }}>
              {currentMode?.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#18181b' }}>
                {currentMode?.label}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '2px' }}>{currentMode?.desc}</p>
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #eef2f6', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)' }}>
            {(mode === 'url' || mode === 'youtube' || mode === 'appstore' || mode === 'telegram' || mode === 'facebook' || mode === 'tiktok' || mode === 'linkedin' || mode === 'twitter' || mode === 'spotify' || mode === 'call') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>
                  {mode === 'call' ? 'TELEFON RAQAMI' : 'MA’LUMOTNI KIRITING'}
                </label>
                <input 
                  type="text" placeholder={mode === 'call' ? '+998...' : 'Kiriting...'} 
                  value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} 
                  style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
              </div>
            )}

            {mode === 'vcard' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>ISM</label>
                  <input type="text" value={vcard.firstName} onChange={e => setVcard({...vcard, firstName: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>FAMILIYA</label>
                  <input type="text" value={vcard.lastName} onChange={e => setVcard({...vcard, lastName: e.target.value})} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>TELEFON</label>
                  <input type="text" value={vcard.phone} onChange={e => setVcard({...vcard, phone: e.target.value})} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>KOMPANIYA / LAVOZIM</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Org" value={vcard.org} onChange={e => setVcard({...vcard, org: e.target.value})} style={inputStyle} />
                    <input type="text" placeholder="Job" value={vcard.job} onChange={e => setVcard({...vcard, job: e.target.value})} style={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            {mode === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>KIMGA (EMAIL)</label>
                  <input type="email" value={emailData.to} onChange={e => setEmailData({...emailData, to: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>MAVZU</label>
                  <input type="text" value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>XABAR</label>
                  <textarea rows={3} value={emailData.body} onChange={e => setEmailData({...emailData, body: e.target.value})} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {mode === 'sms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>TELEFON</label>
                  <input type="text" value={smsData.phone} onChange={e => setSmsData({...smsData, phone: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>XABAR</label>
                  <textarea rows={3} value={smsData.message} onChange={e => setSmsData({...smsData, message: e.target.value})} style={{ ...inputStyle, resize: 'none' }} />
                </div>
              </div>
            )}

            {mode === 'crypto' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>VALYUTA</label>
                  <select value={crypto.currency} onChange={e => setCrypto({...crypto, currency: e.target.value})} style={inputStyle}>
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="litecoin">Litecoin (LTC)</option>
                    <option value="dash">Dash</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>HAMYON MANZILI</label>
                  <input type="text" value={crypto.address} onChange={e => setCrypto({...crypto, address: e.target.value})} style={inputStyle} />
                </div>
              </div>
            )}

            {mode === 'text' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>MATNNI KIRITING</label>
                <textarea 
                  placeholder="Bu yerga xabar yoki matnni yozing..." rows={4}
                  value={inputText} onChange={(e) => setInputText(e.target.value)} 
                  style={{ ...inputStyle, resize: 'none' }} onFocus={handleInputFocus} onBlur={handleInputBlur}
                />
              </div>
            )}

            {mode === 'wifi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>TARMOQ NOMI (SSID)</label>
                  <input type="text" placeholder="WiFi nomi" value={wifi.ssid} onChange={(e) => setWifi({...wifi, ssid: e.target.value})} style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>PAROL</label>
                    <input type="text" placeholder="********" value={wifi.password} onChange={(e) => setWifi({...wifi, password: e.target.value})} style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.6rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>XAVFSIZLIK</label>
                    <select value={wifi.security} onChange={(e) => setWifi({...wifi, security: e.target.value})} style={inputStyle} onFocus={handleInputFocus} onBlur={handleInputBlur}>
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Parolsiz</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {mode === 'calendar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>TADBIR NOMI</label>
                  <input type="text" value={event.title} onChange={e => setEvent({...event, title: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>BOSHLANISHI</label>
                    <input type="datetime-local" value={event.start} onChange={e => setEvent({...event, start: e.target.value})} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: '#64748b', fontWeight: 600 }}>TUGASHI</label>
                    <input type="datetime-local" value={event.end} onChange={e => setEvent({...event, end: e.target.value})} style={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            {(mode === 'image' || mode === 'pdf' || mode === 'audio') && (
              <div 
                onClick={() => document.getElementById('file-upload').click()}
                style={{ 
                  border: '2px dashed #cbd5e1', borderRadius: '1rem', padding: '2rem', textAlign: 'center', 
                  cursor: 'pointer', background: 'white', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = currentMode?.color; e.currentTarget.style.background = `${currentMode?.color}05`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'white'; }}
              >
                <input id="file-upload" type="file" hidden accept={mode === 'image' ? "image/*" : mode === 'pdf' ? ".pdf" : "audio/*"} onChange={handleFileChange} />
                <div style={{ color: currentMode?.color, marginBottom: '0.75rem' }}>
                  {file ? <FileText size={32} style={{ margin: '0 auto' }} /> : (mode === 'image' ? <ImageIcon size={32} style={{ margin: '0 auto' }} /> : mode === 'pdf' ? <FileText size={32} style={{ margin: '0 auto' }} /> : <Volume2 size={32} style={{ margin: '0 auto' }} />)}
                </div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{file ? file.name : (mode === 'image' ? 'Rasmni tanlang' : mode === 'pdf' ? 'PDF faylni tanlang' : 'Audio faylni tanlang')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Fayl hajmi 5MB dan oshmasligi kerak</div>
              </div>
            )}
          </div>


          {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', padding: '1rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 700,
              background: `linear-gradient(135deg, ${currentMode?.color || '#18181b'}, #000)`,
              border: 'none', boxShadow: `0 4px 15px ${currentMode?.color}40`, transition: 'transform 0.2s'
            }} 
            onClick={handleConvert} 
            disabled={uploading}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {uploading ? 'Yuklanmoqda...' : 'QR kod yaratish'}
          </button>
        </div>
      );
    }

    if (step === 'result') {
      return (
        <div style={{ textAlign: 'center', animation: 'scaleUp 0.3s' }}>
          <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #f1f1f1' }}>
            <QRCodeSVG id="qr-result-svg" value={resultUrl} size={220} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', wordBreak: 'break-all', maxWidth: '300px', margin: '0 auto 1.5rem' }}>
            {resultUrl.length > 50 ? resultUrl.substring(0, 47) + '...' : resultUrl}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep('input')}>
              Tahrirlash
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={downloadQR}>
              Yuklab olish (.png)
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      <div className="card" style={{ width: '100%', maxWidth: step === 'grid' ? '600px' : '440px', padding: '2rem', position: 'relative', transition: 'all 0.3s' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f4f4f5', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ×
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: step === 'grid' ? '1.5rem' : '0.5rem', textAlign: step === 'grid' ? 'left' : 'center' }}>
          {step === 'result' ? 'QR kodingiz tayyor!' : 'QR kodga o‘tkazish'}
        </h2>
        {step !== 'grid' && step !== 'result' && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Formatni tanlang va ma’lumotlarni kiriting</p>}
        
        {renderContent()}
      </div>
    </div>
  );
};
