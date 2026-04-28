import React, { useState, useRef, useEffect, useCallback, startTransition } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Smartphone, Monitor, Share, Check, X, QrCode, GripVertical, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, MapPin, AlignLeft, AlignCenter, AlignRight, Loader2, FileUp, FileText } from 'lucide-react';
import { defaultSiteData, defaultQrStyle, generateId, createFreshDefaultSiteData } from '../core/schema';
import { extractMapEmbedSrc, isAllowedMapEmbedUrl } from '../core/mapEmbed';
import { fileToAvatarDataUrl } from '../core/imageUtils';
import { uploadImageToBlob, uploadPdfToBlob } from '../core/blobUpload';
import { templates, applyTemplate } from '../core/templates';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getStoredAuth, clearAuth } from '../auth';
import { ProfileTextStyleControls } from '../components/ProfileTextStyleControls';
import { SCROLL_ANIMATION_OPTIONS } from '../core/scrollAnimation';

const patterns = [
  { id: 'none', name: 'None', url: '' },
  { id: 'moroccan', name: 'Sharqona Naqsh', url: 'url("data:image/svg+xml,%3Csvg width=\\\'60\\\' height=\\\'60\\\' viewBox=\\\'0 0 60 60\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cg fill=\\\'none\\\' fill-rule=\\\'evenodd\\\'%3E%3Cg fill=\\\'%23000000\\\' fill-opacity=\\\'0.06\\\'%3E%3Cpath d=\\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' },
  { id: 'adras', name: 'Milliy Adras', url: 'url("data:image/svg+xml,%3Csvg width=\\\'40\\\' height=\\\'40\\\' viewBox=\\\'0 0 40 40\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z\\\' fill=\\\'%23000000\\\' fill-opacity=\\\'0.05\\\' fill-rule=\\\'evenodd\\\'/%3E%3C/svg%3E")' },
  { id: 'dots', name: 'Nuqtali', url: 'url("data:image/svg+xml,%3Csvg width=\\\'20\\\' height=\\\'20\\\' viewBox=\\\'0 0 20 20\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cg fill=\\\'%23000000\\\' fill-opacity=\\\'0.05\\\' fill-rule=\\\'evenodd\\\'%3E%3Ccircle cx=\\\'3\\\' cy=\\\'3\\\' r=\\\'3\\\'/%3E%3Ccircle cx=\\\'13\\\' cy=\\\'13\\\' r=\\\'3\\\'/%3E%3C/g%3E%3C/svg%3E")' }
];

const exampleImages = [
  { id: 'img1', name: 'Silk Adras', url: 'url("/assets/bg_adras.png")' },
  { id: 'img2', name: 'Zarhal Naqsh', url: 'url("/assets/bg_islamic.png")' }
];

export const Builder = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editSlug = (searchParams.get('slug') || '').trim().toUpperCase();

  const [siteData, setSiteData] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('new') === '1' && !(p.get('slug') || '').trim()) {
        try {
          localStorage.removeItem('draftSiteData');
        } catch {
          /* ignore */
        }
        return createFreshDefaultSiteData();
      }
    }
    try {
      const saved = localStorage.getItem('draftSiteData');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return createFreshDefaultSiteData();
  });
  
  const [activeTab, setActiveTab] = useState('design');
  const [activeLang, setActiveLang] = useState(siteData.lang || 'uz');
  const [previewMode, setPreviewMode] = useState('mobile');
  const [publishModal, setPublishModal] = useState({ open: false, slug: '', copied: false });
  const iframeRef = useRef(null);
  const qrSvgExportRef = useRef(null);
  const [loadError, setLoadError] = useState('');
  /** PDF yuklash: qator kaliti + progress (0–100) */
  const [pdfUpload, setPdfUpload] = useState(null);
  /** Fayl qatori o‘chirish (serverga so‘rov) */
  const [downloadDeleting, setDownloadDeleting] = useState(null);
  const [pdfQuota, setPdfQuota] = useState(null);

  const refreshPdfQuota = useCallback(async () => {
    const auth = getStoredAuth();
    if (!auth?.token) {
      setPdfQuota(null);
      return;
    }
    try {
      const r = await fetch('/api/pdf-quota', { headers: { Authorization: `Bearer ${auth.token}` } });
      if (!r.ok) return;
      const j = await r.json();
      setPdfQuota(j);
    } catch {
      setPdfQuota(null);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void refreshPdfQuota();
    });
  }, [refreshPdfQuota, editSlug]);

  /** Dashboard dan «Yangi sayt» (?new=1): qoralama tozalansin, URL dan param olib tashlansin. */
  useEffect(() => {
    if (editSlug) return;
    if (searchParams.get('new') !== '1') return;
    try {
      localStorage.removeItem('draftSiteData');
    } catch {
      /* ignore */
    }
    startTransition(() => {
      setSiteData(createFreshDefaultSiteData());
      setSearchParams({}, { replace: true });
    });
  }, [editSlug, searchParams, setSearchParams]);

  useEffect(() => {
    if (!editSlug) {
      startTransition(() => setLoadError(''));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const auth = getStoredAuth();
        const headers = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
        const url = auth?.token
          ? `/api/get-site-editor?slug=${encodeURIComponent(editSlug)}`
          : `/api/get-site?slug=${encodeURIComponent(editSlug)}`;
        const res = await fetch(url, { headers });
        if (res.status === 401) {
          if (!cancelled) setLoadError('Tahrirlash uchun hisobga kiring');
          return;
        }
        if (!res.ok) {
          if (!cancelled) setLoadError('Sayt topilmadi');
          return;
        }
        const data = await res.json();
        if (data?.locked) {
          if (!cancelled) setLoadError('Tahrirlash uchun hisobga kiring');
          return;
        }
        if (!cancelled) {
          setSiteData({
            ...defaultSiteData,
            ...data,
            qrStyle: { ...defaultQrStyle, ...(data.qrStyle || {}) },
            seo: { ...defaultSiteData.seo, ...(data.seo || {}) },
            privacy: { ...defaultSiteData.privacy, ...(data.privacy || {}), password: '' },
            content: data.content || defaultSiteData.content,
            globalStyle: data.globalStyle || defaultSiteData.globalStyle,
          });
          setLoadError('');
        }
      } catch {
        if (!cancelled) setLoadError('Yuklashda xato');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editSlug]);

  useEffect(() => {
    try {
      localStorage.setItem('draftSiteData', JSON.stringify(siteData));
    } catch (err) {
      console.warn('Draft localStorage save failed (image too large or quota)', err);
    }
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage({ type: 'UPDATE_SITE_DATA', payload: { ...siteData, lang: siteData.lang || activeLang } }, '*');
    }
  }, [siteData, activeLang]);

  useEffect(() => {
    const handleIframeMessage = (e) => {
      if (e.data?.type === 'SECTION_REORDER') {
        setSiteData(prev => {
          const newSections = Array.from(prev.content.sections || []);
          const [moved] = newSections.splice(e.data.sourceIndex, 1);
          newSections.splice(e.data.destinationIndex, 0, moved);
          return { ...prev, content: { ...prev.content, sections: newSections } };
        });
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  const handleIframeLoad = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_SITE_DATA', payload: siteData }, '*');
    }
  };

  const handleTemplateSelect = (templateId) => setSiteData(applyTemplate(siteData, templateId));

  const handleGlobalStyleChange = (key, value) => {
    setSiteData({ ...siteData, globalStyle: { ...siteData.globalStyle, [key]: value } });
  };

  const handleQrStyleChange = (key, value) => {
    setSiteData({
      ...siteData,
      qrStyle: { ...(siteData.qrStyle || defaultQrStyle), [key]: value },
    });
  };

  const handleContentChange = (key, value) => {
    // Check if it's a localized field
    const localizedFields = ['title', 'subtitle', 'description'];
    if (localizedFields.includes(key)) {
      const prevVal = siteData.content[key];
      const newVal = typeof prevVal === 'object' && prevVal !== null 
        ? { ...prevVal, [activeLang]: value }
        : { uz: prevVal || '', ru: prevVal || '', en: prevVal || '', [activeLang]: value };
      setSiteData({ ...siteData, content: { ...siteData.content, [key]: newVal } });
    } else {
      setSiteData({ ...siteData, content: { ...siteData.content, [key]: value } });
    }
  };

  const getVal = (val, lang = activeLang) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val[lang] || '';
  };

  const handleSeoChange = (key, value) => {
    setSiteData({ ...siteData, seo: { ...(siteData.seo || {}), [key]: value } });
  };

  const handlePrivacyChange = (key, value) => {
    setSiteData({ ...siteData, privacy: { ...(siteData.privacy || {}), [key]: value } });
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const dataUrl = await fileToAvatarDataUrl(file, 1920);
    if (!dataUrl) return;
    const blobUrl = await uploadImageToBlob(dataUrl, 'background');
    handleGlobalStyleChange('backgroundImage', `url(${blobUrl || dataUrl})`);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const dataUrl = await fileToAvatarDataUrl(file, 512);
    if (!dataUrl) return;
    const blobUrl = await uploadImageToBlob(dataUrl, 'avatar');
    handleContentChange('avatar', blobUrl || dataUrl);
  };

  const handleQrLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const dataUrl = await fileToAvatarDataUrl(file, 256);
    if (!dataUrl) return;
    const blobUrl = await uploadImageToBlob(dataUrl, 'qr-logo');
    handleQrStyleChange('logoUrl', blobUrl || dataUrl);
  };

  const MultilingualSectionTitle = ({ section }) => (
    <div className="flex-col gap-1 mb-2">
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Blok sarlavhasi (UZ/RU/EN):</span>
      <div className="flex gap-1">
        {['uz', 'ru', 'en'].map(l => (
          <input
            key={l}
            type="text"
            className="input-field"
            style={{ fontSize: '0.75rem', padding: '0.35rem' }}
            placeholder={l.toUpperCase()}
            value={getVal(section.data.title, l)}
            onChange={(e) => {
              const prev = section.data.title;
              const newVal = typeof prev === 'object' ? { ...prev, [l]: e.target.value } : { uz: prev, ru: prev, en: prev, [l]: e.target.value };
              updateSectionData(section.id, { ...section.data, title: newVal });
            }}
          />
        ))}
      </div>
    </div>
  );

  const LocalLangTabs = () => (
    <div className="flex gap-1 mb-1">
      {['uz', 'ru', 'en'].map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setActiveLang(l)}
          className={`lang-tag ${activeLang === l ? 'lang-tag-active' : ''}`}
          style={{ 
            fontSize: '0.62rem', 
            padding: '2px 8px', 
            minWidth: '32px',
            opacity: activeLang === l ? 1 : 0.6,
            cursor: 'pointer',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeLang === l ? 'var(--primary-color)' : 'var(--bg-tertiary)',
            color: activeLang === l ? '#fff' : 'var(--text-secondary)'
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const exportSiteJson = () => {
    const blob = new Blob([JSON.stringify(siteData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `site-${(siteData.id || 'backup').slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importSiteJson = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const j = JSON.parse(String(reader.result));
        if (!j.content || typeof j.content !== 'object' || !j.globalStyle) {
          alert('Noto‘g‘ri JSON: content va globalStyle kerak');
          return;
        }
        if (!window.confirm('Joriy loyiha import bilan almashtirilsinmi?')) return;
        setSiteData({
          ...defaultSiteData,
          ...j,
          id: j.id || generateId(),
          content: j.content,
          globalStyle: j.globalStyle,
          qrStyle: { ...defaultQrStyle, ...(j.qrStyle || {}) },
          seo: { ...defaultSiteData.seo, ...(j.seo || {}) },
          privacy: { ...defaultSiteData.privacy, ...(j.privacy || {}), password: '' },
        });
      } catch {
        alert('JSON o‘qib bo‘lmadi');
      }
    };
    reader.readAsText(file);
  };

  // Sections management
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    if (result.type === 'item') {
      const sectionId = result.source.droppableId.replace('items-', '');
      const section = siteData.content.sections.find(s => s.id === sectionId);
      if (!section) return;
      const newItems = Array.from(section.data.items || []);
      const [moved] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, moved);
      updateSectionData(sectionId, { items: newItems });
      return;
    }

    const newSections = Array.from(siteData.content.sections || []);
    const [reorderedItem] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, reorderedItem);
    handleContentChange('sections', newSections);
  };

  const moveSection = (index, direction) => {
    const newSections = [...siteData.content.sections];
    if (direction === 'up' && index > 0) {
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    } else if (direction === 'down' && index < newSections.length - 1) {
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
    }
    handleContentChange('sections', newSections);
  };

  const removeSection = (index) => {
    const newSections = [...siteData.content.sections];
    newSections.splice(index, 1);
    handleContentChange('sections', newSections);
  };

  const addSection = (type) => {
    const newSection = { id: generateId(), type, data: {} };
    if (type === 'links' || type === 'social') newSection.data.items = [{ id: generateId(), title: { uz: 'Yangi havola', ru: 'Новая ссылка', en: 'New Link' }, url: 'https://', platform: 'twitter' }];
    if (type === 'contact') newSection.data = { items: [{ id: generateId(), type: 'phone', value: '', label: { uz: 'Telefon', ru: 'Телефон', en: 'Call' } }] };
    if (type === 'text') {
      newSection.data = {
        text: { uz: 'Yangi matn bloki', ru: 'Новый текстовый блок', en: 'New text block' },
        align: 'center',
        fontSize: 'base',
        fontWeight: 'normal',
        color: '',
      };
    }
    if (type === 'map') newSection.data = { title: { uz: 'Manzilimiz', ru: 'Наш адрес', en: 'Our Location' }, mapProvider: 'google', embedUrl: '' };
    if (type === 'faq') {
      newSection.data = {
        title: { uz: 'Savol-javoblar', ru: 'Вопросы и ответы', en: 'FAQ' },
        items: [{ id: generateId(), question: { uz: 'Savol?', ru: 'Вопрос?', en: 'Question?' }, answer: { uz: 'Javob.', ru: 'Ответ.', en: 'Answer.' } }],
      };
    }
    if (type === 'gallery') {
      newSection.data = {
        title: { uz: 'Galereya', ru: 'Галерея', en: 'Gallery' },
        items: [{ id: generateId(), url: 'https://picsum.photos/seed/qr/400/300', caption: { uz: '', ru: '', en: '' } }],
      };
    }
    if (type === 'video') {
      newSection.data = { title: { uz: 'Video', ru: 'Видео', en: 'Video' }, youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
    }
    if (type === 'hours') {
      newSection.data = {
        title: { uz: 'Ish vaqti', ru: 'Рабочее время', en: 'Working Hours' },
        lines: [
          { id: generateId(), label: { uz: 'Dush–Juma', ru: 'Пон–Пят', en: 'Mon–Fri' }, value: '9:00 – 18:00' },
          { id: generateId(), label: { uz: 'Shanba', ru: 'Суббота', en: 'Saturday' }, value: '10:00 – 14:00' },
        ],
      };
    }
    if (type === 'downloads') {
      newSection.data = {
        title: { uz: 'Fayllar', ru: 'Файлы', en: 'Downloads' },
        items: [
          {
            id: generateId(),
            title: { uz: 'Hujjat', ru: 'Документ', en: 'Document' },
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            fileType: 'PDF',
          },
        ],
      };
    }
    if (type === 'quick_actions') {
      newSection.data = {
        title: { uz: 'Bog‘lanish', ru: 'Связаться', en: 'Contact' },
        items: [
          { id: generateId(), type: 'whatsapp', label: { uz: 'WhatsApp', ru: 'WhatsApp', en: 'WhatsApp' }, value: '' },
          { id: generateId(), type: 'telegram', label: { uz: 'Telegram', ru: 'Telegram', en: 'Telegram' }, value: '' },
        ],
      };
    }

    handleContentChange('sections', [...siteData.content.sections, newSection]);
  };

  const updateSectionData = (sectionId, updatedData) => {
    const newSections = siteData.content.sections.map(s => s.id === sectionId ? { ...s, data: updatedData } : s);
    handleContentChange('sections', newSections);
  };

  const handleDownloadsPdfPick = async (sectionId, itemIndex, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const auth = getStoredAuth();
    if (!auth?.token) {
      alert('PDF yuklash uchun avval kiring.');
      navigate('/login');
      return;
    }

    const section = siteData.content.sections.find((s) => s.id === sectionId);
    if (!section?.data?.items?.[itemIndex]) return;

    const key = `${sectionId}-${itemIndex}`;
    setPdfUpload({ key, progress: 0 });
    try {
      const prev = section.data.items[itemIndex];
      const replaceUrl =
        prev.url && String(prev.url).includes('blob.vercel-storage.com') ? String(prev.url) : '';
      const result = await uploadPdfToBlob(file, auth.token, {
        replaceUrl,
        onUploadProgress: ({ percentage }) => {
          const p = Math.min(100, Math.max(0, Math.round(Number(percentage) || 0)));
          setPdfUpload((prevState) => (prevState?.key === key ? { key, progress: p } : prevState));
        },
      });
      if (!result.ok) {
        alert(result.error || 'Yuklash muvaffaqiyatsiz');
        return;
      }
      const items = [...section.data.items];
      const baseTitle = (prev.title || '').trim();
      const fromFile = file.name.replace(/\.pdf$/i, '').trim();
      items[itemIndex] = {
        ...prev,
        url: result.url,
        fileType: 'PDF',
        sizeBytes: result.sizeBytes,
        title: baseTitle || fromFile || prev.title,
      };
      updateSectionData(sectionId, { ...section.data, items });
      void refreshPdfQuota();
    } finally {
      setPdfUpload(null);
    }
  };

  const handleRemoveDownloadsRow = async (sectionId, itemId, itemIndex) => {
    const auth = getStoredAuth();
    const section = siteData.content.sections.find((s) => s.id === sectionId);
    const item = section?.data?.items?.[itemIndex];
    if (!item || item.id !== itemId) return;

    const delKey = `${sectionId}-${itemId}`;
    const label = (item.title || '').trim() || `PDF ${itemIndex + 1}`;
    const msg = editSlug
      ? `«${label}» o‘chirilsinmi?\n\nBazadagi sayt darhol yangilanadi. Vercel Blob dagi PDF ham o‘chiriladi.`
      : `«${label}» qoralamadan olib tashlansinmi?\n\n(Sayt hali saqlanmagan — serverdagi ma’lumot o‘zgarmaydi.)`;

    if (!window.confirm(msg)) return;

    if (editSlug) {
      if (!auth?.token) {
        alert('O‘chirish uchun avval kiring.');
        navigate('/login');
        return;
      }
      setDownloadDeleting(delKey);
      try {
        const res = await fetch('/api/remove-download-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ slug: editSlug, sectionId, itemId }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(j.error || 'O‘chirib bo‘lmadi');
          return;
        }
        if (j.site) {
          setSiteData((prev) => ({
            ...prev,
            ...j.site,
            qrStyle: { ...(prev.qrStyle || defaultQrStyle), ...(j.site.qrStyle || {}) },
            seo: { ...(prev.seo || defaultSiteData.seo), ...(j.site.seo || {}) },
            privacy: { ...(prev.privacy || defaultSiteData.privacy), ...(j.site.privacy || {}), password: '' },
            content: j.site.content || prev.content,
            globalStyle: j.site.globalStyle || prev.globalStyle,
          }));
        }
        void refreshPdfQuota();
      } catch (err) {
        alert(err?.message || 'Tarmoq xatosi');
      } finally {
        setDownloadDeleting(null);
      }
      return;
    }

    const newItems = section.data.items.filter((it) => it.id !== itemId);
    updateSectionData(sectionId, { ...section.data, items: newItems });
  };

  const removeSectionItem = (sectionId, itemIndex) => {
    const section = siteData.content.sections.find((s) => s.id === sectionId);
    if (!section?.data?.items) return;
    const newItems = section.data.items.filter((_, idx) => idx !== itemIndex);
    updateSectionData(sectionId, { items: newItems });
  };

  // Publish
  const handlePublish = () => {
    const defaultSlug = editSlug || Math.random().toString(36).substring(2, 8).toUpperCase();
    setPublishModal({ open: true, slug: defaultSlug, copied: false });
  };

  const confirmPublish = async () => {
    const auth = getStoredAuth();
    if (!auth?.token) {
      alert('Saqlash uchun avval kirishingiz kerak.');
      navigate('/login');
      return;
    }
    setPublishModal(prev => ({ ...prev, isPublishing: true }));
    try {
      const slugNorm = publishModal.slug.trim().toUpperCase();
      const response = await fetch('/api/site-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          slug: slugNorm,
          data: siteData,
        }),
      });

      const j = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(j.error || 'Saqlanmadi');
      }

      const liveUrl = `${window.location.origin}/${slugNorm}`;
      try {
        const cached = JSON.parse(JSON.stringify(siteData));
        if (cached.privacy) cached.privacy.password = '';
        localStorage.setItem(`published_${slugNorm}`, JSON.stringify(cached));
      } catch {
        localStorage.setItem(`published_${slugNorm}`, JSON.stringify(siteData));
      }
      setSiteData((prev) => ({
        ...prev,
        privacy: { ...(prev.privacy || {}), password: '' },
      }));
      setPublishModal({ ...publishModal, slug: slugNorm, publishedUrl: liveUrl, isPublishing: false });
      void refreshPdfQuota();
    } catch (error) {
      console.error('Publish error:', error);
      alert(error.message || 'Saqlashda xato. Qayta urinib ko‘ring.');
      setPublishModal(prev => ({ ...prev, isPublishing: false }));
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-${publishModal.slug}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const downloadQrSvg = () => {
    const wrap = qrSvgExportRef.current;
    const svg = wrap?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${publishModal.slug}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const publishQrImageSettings = () => {
    const qs = siteData.qrStyle || defaultQrStyle;
    const logo = (qs.logoUrl || '').trim();
    const sz = qs.size || 256;
    const pct = (qs.logoSize ?? 22) / 100;
    if (!logo) return undefined;
    const wh = Math.round(sz * pct);
    return { src: logo, height: wh, width: wh, excavate: true };
  };

  return (
    <div className="app-container">
      {/* Sidebar Editor */}
      <div className="editor-sidebar">
        <div className="editor-header">
          <div className="editor-header__brand">
            <QrCode className="text-primary-color" size={22} style={{ flexShrink: 0 }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Mini Site Builder</h2>
          </div>
          <div className="editor-header__actions">
            <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Saytlarim
            </Link>
            {getStoredAuth()?.token && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  clearAuth();
                  navigate('/login');
                }}
              >
                Chiqish
              </button>
            )}
          </div>

            <button type="button" className="btn btn-primary" onClick={handlePublish}>
              Saqlash
            </button>
          </div>

        {loadError && (
          <div style={{ padding: '0.75rem 1.5rem', background: '#fef2f2', color: '#b91c1c', fontSize: '0.875rem' }}>
            {loadError}
          </div>
        )}

        <div className="flex border-b" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: '73px', zIndex: 9 }}>
          <button 
            style={{ flex: 1, padding: '1rem', borderBottom: activeTab === 'design' ? '2px solid var(--primary-color)' : '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'design' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button 
            style={{ flex: 1, padding: '1rem', borderBottom: activeTab === 'content' ? '2px solid var(--primary-color)' : '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'content' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button 
            style={{ flex: 1, padding: '1rem', borderBottom: activeTab === 'settings' ? '2px solid var(--primary-color)' : '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('settings')}
          >
            Sozlamalar
          </button>
        </div>

        {activeTab === 'design' && (
          <div>
            <div className="editor-section">
              <span className="label">Templates</span>
              <div className="template-grid mt-4">
                {templates.map(t => (
                  <div 
                    key={t.id} 
                    className={`card template-card ${siteData.theme === t.id ? 'active' : ''}`}
                    onClick={() => handleTemplateSelect(t.id)}
                    style={{
                      background: t.style.backgroundGradient || t.style.backgroundColor,
                      color: t.style.textColor, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80px', fontFamily: t.style.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Inter", sans-serif',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Colors</span>
              <div className="flex-col gap-3 mt-4">
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Background</span>
                  <input type="color" value={siteData.globalStyle.backgroundColor} onChange={(e) => handleGlobalStyleChange('backgroundColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Text</span>
                  <input type="color" value={siteData.globalStyle.textColor} onChange={(e) => handleGlobalStyleChange('textColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Primary / Accent</span>
                  <input type="color" value={siteData.globalStyle.primaryColor} onChange={(e) => handleGlobalStyleChange('primaryColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                </div>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Background & Patterns</span>
              <div className="flex-col gap-3 mt-4">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patterns</span>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {patterns.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => handleGlobalStyleChange('backgroundImage', p.url)}
                      className={`btn ${siteData.globalStyle.backgroundImage === p.url ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem' }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Example Layouts</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                   {exampleImages.map(img => (
                      <div 
                         key={img.id}
                         onClick={() => handleGlobalStyleChange('backgroundImage', img.url)}
                         style={{
                            height: '60px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundImage: img.url,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            border: siteData.globalStyle.backgroundImage === img.url ? '2px solid var(--primary-color)' : '2px solid transparent',
                            display: 'flex', alignItems: 'flex-end', padding: '4px'
                         }}
                      >
                         <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px' }}>{img.name}</span>
                      </div>
                   ))}
                </div>

                <div style={{ position: 'relative', width: '100%', marginTop: '0.5rem' }}>
                  <label htmlFor="bg-upload" className="btn btn-secondary w-full" style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-color)', padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-tertiary)', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>Upload Custom Image</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>JPG, PNG or WEBP</span>
                  </label>
                  <input id="bg-upload" type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                </div>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Styling</span>
              <div className="flex-col gap-3 mt-4">
                <div>
                  <span style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Button Style</span>
                  <select className="input-field" value={siteData.globalStyle.buttonStyle} onChange={(e) => handleGlobalStyleChange('buttonStyle', e.target.value)}>
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                    <option value="soft">Soft</option>
                    <option value="glass">Glassmorphism</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Border Radius</span>
                  <select className="input-field" value={siteData.globalStyle.borderRadius} onChange={(e) => handleGlobalStyleChange('borderRadius', e.target.value)}>
                    <option value="0px">Sharp</option>
                    <option value="8px">Rounded</option>
                    <option value="16px">Smooth</option>
                    <option value="9999px">Pill</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Top Navigation Buttons</span>
              <div className="flex-col gap-3 mt-4">
                 {siteData.globalStyle.headerButtons?.map((btn, i) => (
                   <div key={btn.id} className="card p-3 flex-col gap-2" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Button Name" 
                        value={getVal(btn.label)} 
                        onChange={(e) => {
                          const newBtns = [...siteData.globalStyle.headerButtons];
                          const prev = newBtns[i].label;
                          newBtns[i].label = typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value };
                          handleGlobalStyleChange('headerButtons', newBtns);
                        }} 
                      />
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="URL" 
                        value={btn.url} 
                        onChange={(e) => {
                          const newBtns = [...siteData.globalStyle.headerButtons];
                          newBtns[i].url = e.target.value;
                          handleGlobalStyleChange('headerButtons', newBtns);
                        }} 
                      />
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.7rem', color: '#ef4444' }} onClick={() => {
                        const newBtns = siteData.globalStyle.headerButtons.filter((_, idx) => idx !== i);
                        handleGlobalStyleChange('headerButtons', newBtns);
                      }}>Delete</button>
                   </div>
                 ))}
                 <button type="button" className="btn btn-secondary w-full" onClick={() => {
                   const newBtns = [...(siteData.globalStyle.headerButtons || []), { id: generateId(), label: { uz: 'Yangi', ru: 'Новый', en: 'New' }, url: '#' }];
                   handleGlobalStyleChange('headerButtons', newBtns);
                 }}>+ Add Header Button</button>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">AOS Settings</span>
              <div className="flex-col gap-3 mt-4">
                  <span style={{ fontSize: '0.875rem', display: 'block' }}>Scroll animatsiya (AOS)</span>
                  <select
                    className="input-field"
                    value={siteData.globalStyle.scrollAnimation || 'none'}
                    onChange={(e) => handleGlobalStyleChange('scrollAnimation', e.target.value)}
                  >
                    {SCROLL_ANIMATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                    Bloklar scroll qilganda tanlangan effekt bilan paydo bo‘ladi.
                  </p>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">QR kod</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
                Sayt saqlagach chiqadigan QR — rang va o‘lchamni shu yerda sozlang.
              </p>
              <div className="flex-col gap-3 mt-2">
                <div className="flex justify-between items-center gap-3">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nuqta rangi</span>
                  <input
                    type="color"
                    value={(siteData.qrStyle || defaultQrStyle).fgColor}
                    onChange={(e) => handleQrStyleChange('fgColor', e.target.value)}
                    style={{ width: '44px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  />
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fon rangi</span>
                  <input
                    type="color"
                    value={(siteData.qrStyle || defaultQrStyle).bgColor}
                    onChange={(e) => handleQrStyleChange('bgColor', e.target.value)}
                    style={{ width: '44px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Xatolik tuzatish (sifat)</span>
                  <select
                    className="input-field"
                    value={(siteData.qrStyle || defaultQrStyle).level}
                    onChange={(e) => handleQrStyleChange('level', e.target.value)}
                  >
                    <option value="L">Past (L)</option>
                    <option value="M">O‘rta (M)</option>
                    <option value="Q">Yuqori (Q)</option>
                    <option value="H">Maksimal (H)</option>
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Rasm o‘lchami (px)</span>
                  <select
                    className="input-field"
                    value={String((siteData.qrStyle || defaultQrStyle).size)}
                    onChange={(e) => handleQrStyleChange('size', Number(e.target.value))}
                  >
                    <option value="180">180</option>
                    <option value="200">200</option>
                    <option value="256">256</option>
                    <option value="320">320</option>
                    <option value="400">400</option>
                  </select>
                </div>
                <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={(siteData.qrStyle || defaultQrStyle).includeMargin !== false}
                    onChange={(e) => handleQrStyleChange('includeMargin', e.target.checked)}
                  />
                  Chekka bo‘shliq (margin)
                </label>
                <div>
                  <span style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>QR markazidagi logo (ixtiyoriy)</span>
                  <div className="flex gap-2 flex-wrap items-center">
                    <label className="btn btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                      Logo yuklash
                      <input type="file" accept="image/*" onChange={handleQrLogoUpload} style={{ display: 'none' }} />
                    </label>
                    {(siteData.qrStyle || defaultQrStyle).logoUrl ? (
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => handleQrStyleChange('logoUrl', '')}>
                        Logoni olib tashlash
                      </button>
                    ) : null}
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logo o‘lchami: {(siteData.qrStyle || defaultQrStyle).logoSize ?? 22}%</span>
                    <input
                      type="range"
                      min={12}
                      max={35}
                      value={(siteData.qrStyle || defaultQrStyle).logoSize ?? 22}
                      onChange={(e) => handleQrStyleChange('logoSize', Number(e.target.value))}
                      style={{ width: '100%', marginTop: '0.35rem' }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => setSiteData({ ...siteData, qrStyle: { ...defaultQrStyle } })}
                >
                  QR ni standartga qaytarish
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className="editor-section" style={{ position: 'sticky', top: '0', zIndex: 10, background: 'var(--bg-primary-soft)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '2px solid var(--primary-color)', margin: '0 -1rem 1rem -1rem', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div className="flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Ma'lumot to'ldirish tili:</span>
                  <div className="flex gap-1 p-1" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    {['uz', 'ru', 'en'].map(l => (
                      <button
                        key={l}
                        onClick={() => setActiveLang(l)}
                        className={`lang-tag ${activeLang === l ? 'lang-tag-active' : ''}`}
                        style={{ padding: '8px 16px', border: 'none', transition: 'all 0.2s', fontSize: '0.75rem' }}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
                  <Info size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Pastdagi maydonlar tanlangan tilda (<b>{activeLang.toUpperCase()}</b>) to'ldiriladi. Boshqa tildagi matnni yozish uchun tilni almashtiring.
                </p>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Profile Information</span>
              <div className="flex-col gap-3 mt-4">
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Avatar</span>
                  <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: (siteData.content.avatarShape || 'circle') === 'square' ? '12px' : '50%',
                        overflow: 'hidden',
                        background: 'var(--bg-tertiary)',
                        border: '2px dashed var(--border-color)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {siteData.content.avatar ? (
                        <img src={siteData.content.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', padding: '4px' }}>Rasm yo‘q</span>
                      )}
                    </div>
                    <div className="flex-col gap-2" style={{ flex: 1, minWidth: '140px' }}>
                      <label htmlFor="avatar-upload" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', cursor: 'pointer', textAlign: 'center' }}>
                        Rasm yuklash
                      </label>
                      <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      {siteData.content.avatar && (
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem' }} onClick={() => handleContentChange('avatar', '')}>
                          Olib tashlash
                        </button>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.75rem', marginBottom: '0.35rem' }}>Shakl</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`btn ${(siteData.content.avatarShape || 'circle') !== 'square' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
                      onClick={() => handleContentChange('avatarShape', 'circle')}
                    >
                      Aylana
                    </button>
                    <button
                      type="button"
                      className={`btn ${(siteData.content.avatarShape || 'circle') === 'square' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
                      onClick={() => handleContentChange('avatarShape', 'square')}
                    >
                      To‘rtburchak
                    </button>
                  </div>
                </div>
                <div className="flex-col gap-1">
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ism / sarlavha</span>
                  <ProfileTextStyleControls
                    fieldKey="title"
                    style={siteData.content.titleStyle}
                    globalTextColor={siteData.globalStyle.textColor}
                    onPatch={(patch) => handleContentChange('titleStyle', { ...(siteData.content.titleStyle || {}), ...patch })}
                  />
                  <div className="flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <span className="lang-tag">UZ</span>
                      <input type="text" className="input-field" placeholder="Ism (UZ)" value={getVal(siteData.content.title, 'uz')} onChange={(e) => {
                        const prev = siteData.content.title;
                        const newVal = typeof prev === 'object' ? { ...prev, uz: e.target.value } : { uz: e.target.value, ru: prev, en: prev };
                        setSiteData({ ...siteData, content: { ...siteData.content, title: newVal } });
                      }} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="lang-tag">RU</span>
                      <input type="text" className="input-field" placeholder="Имя (RU)" value={getVal(siteData.content.title, 'ru')} onChange={(e) => {
                        const prev = siteData.content.title;
                        const newVal = typeof prev === 'object' ? { ...prev, ru: e.target.value } : { uz: prev, ru: e.target.value, en: prev };
                        setSiteData({ ...siteData, content: { ...siteData.content, title: newVal } });
                      }} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="lang-tag">EN</span>
                      <input type="text" className="input-field" placeholder="Name (EN)" value={getVal(siteData.content.title, 'en')} onChange={(e) => {
                        const prev = siteData.content.title;
                        const newVal = typeof prev === 'object' ? { ...prev, en: e.target.value } : { uz: prev, ru: prev, en: e.target.value };
                        setSiteData({ ...siteData, content: { ...siteData.content, title: newVal } });
                      }} />
                    </div>
                  </div>
                </div>
                <div className="flex-col gap-1">
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sarlavha osti</span>
                  <ProfileTextStyleControls
                    fieldKey="subtitle"
                    style={siteData.content.subtitleStyle}
                    globalTextColor={siteData.globalStyle.textColor}
                    onPatch={(patch) => handleContentChange('subtitleStyle', { ...(siteData.content.subtitleStyle || {}), ...patch })}
                  />
                  <div className="flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <span className="lang-tag">UZ</span>
                      <input type="text" className="input-field" placeholder="Tagline (UZ)" value={getVal(siteData.content.subtitle, 'uz')} onChange={(e) => {
                        const prev = siteData.content.subtitle;
                        const newVal = typeof prev === 'object' ? { ...prev, uz: e.target.value } : { uz: e.target.value, ru: prev, en: prev };
                        setSiteData({ ...siteData, content: { ...siteData.content, subtitle: newVal } });
                      }} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="lang-tag">RU</span>
                      <input type="text" className="input-field" placeholder="Подзаголовок (RU)" value={getVal(siteData.content.subtitle, 'ru')} onChange={(e) => {
                        const prev = siteData.content.subtitle;
                        const newVal = typeof prev === 'object' ? { ...prev, ru: e.target.value } : { uz: prev, ru: e.target.value, en: prev };
                        setSiteData({ ...siteData, content: { ...siteData.content, subtitle: newVal } });
                      }} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="lang-tag">EN</span>
                      <input type="text" className="input-field" placeholder="Subtitle (EN)" value={getVal(siteData.content.subtitle, 'en')} onChange={(e) => {
                        const prev = siteData.content.subtitle;
                        const newVal = typeof prev === 'object' ? { ...prev, en: e.target.value } : { uz: prev, ru: prev, en: e.target.value };
                        setSiteData({ ...siteData, content: { ...siteData.content, subtitle: newVal } });
                      }} />
                    </div>
                  </div>
                </div>
                <div className="flex-col gap-1">
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tavsif</span>
                  <ProfileTextStyleControls
                    fieldKey="description"
                    style={siteData.content.descriptionStyle}
                    globalTextColor={siteData.globalStyle.textColor}
                    onPatch={(patch) => handleContentChange('descriptionStyle', { ...(siteData.content.descriptionStyle || {}), ...patch })}
                  />
                  <div className="flex-col gap-2">
                    <div className="flex-col gap-1">
                      <span className="lang-tag w-fit px-2" style={{ fontSize: '0.65rem' }}>O'zbekcha (UZ)</span>
                      <textarea className="input-field" style={{ minHeight: '60px' }} value={getVal(siteData.content.description, 'uz')} onChange={(e) => {
                        const prev = siteData.content.description;
                        const newVal = typeof prev === 'object' ? { ...prev, uz: e.target.value } : { uz: e.target.value, ru: prev, en: prev };
                        setSiteData({ ...siteData, content: { ...siteData.content, description: newVal } });
                      }} />
                    </div>
                    <div className="flex-col gap-1">
                      <span className="lang-tag w-fit px-2" style={{ fontSize: '0.65rem' }}>Русский (RU)</span>
                      <textarea className="input-field" style={{ minHeight: '60px' }} value={getVal(siteData.content.description, 'ru')} onChange={(e) => {
                        const prev = siteData.content.description;
                        const newVal = typeof prev === 'object' ? { ...prev, ru: e.target.value } : { uz: prev, ru: e.target.value, en: prev };
                        setSiteData({ ...siteData, content: { ...siteData.content, description: newVal } });
                      }} />
                    </div>
                    <div className="flex-col gap-1">
                      <span className="lang-tag w-fit px-2" style={{ fontSize: '0.65rem' }}>English (EN)</span>
                      <textarea className="input-field" style={{ minHeight: '60px' }} value={getVal(siteData.content.description, 'en')} onChange={(e) => {
                        const prev = siteData.content.description;
                        const newVal = typeof prev === 'object' ? { ...prev, en: e.target.value } : { uz: prev, ru: prev, en: e.target.value };
                        setSiteData({ ...siteData, content: { ...siteData.content, description: newVal } });
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Sections</span>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="sections-list" type="section">
                  {(provided) => (
                    <div className="flex-col gap-3 mt-4" {...provided.droppableProps} ref={provided.innerRef}>
                      {siteData.content.sections?.map((section, idx) => (
                        <Draggable key={section.id} draggableId={section.id} index={idx}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps}
                              className="card relative p-4 flex-col gap-3" 
                              style={{ 
                                background: 'var(--bg-primary)', 
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                ...provided.draggableProps.style 
                              }}
                            >
                              <div className="flex justify-between items-center border-b pb-2 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', color: 'var(--text-muted)' }}>
                                    <GripVertical size={16} />
                                  </div>
                                  <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.875rem' }}>
                                    {(
                                      {
                                        map: 'Location',
                                        faq: 'FAQ',
                                        gallery: 'Gallery',
                                        video: 'Video',
                                        hours: 'Ish vaqti',
                                        downloads: 'Yuklash',
                                        quick_actions: 'Tezkor aloqa',
                                      }[section.type] || section.type
                                    )}{' '}
                                    Block
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => moveSection(idx, 'up')}><ArrowUp size={16} /></button>
                                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => moveSection(idx, 'down')}><ArrowDown size={16} /></button>
                                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} onClick={() => removeSection(idx)}><Trash2 size={16} /></button>
                                </div>
                              </div>

                    {(section.type === 'links' || section.type === 'social' || section.type === 'contact') && (
                      <Droppable droppableId={`items-${section.id}`} type="item">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="flex-col gap-2">
                            {section.data.items?.map((item, i) => (
                              <Draggable key={item.id} draggableId={item.id} index={i}>
                                {(provided, snapshot) => (
                                  <div 
                                    ref={provided.innerRef} 
                                    {...provided.draggableProps} 
                                    className={`flex${(section.type === 'links' || section.type === 'contact') ? '-col' : ''} gap-2 p-2`} 
                                    style={{ 
                                      background: 'var(--bg-secondary)', 
                                      borderRadius: 'var(--radius-sm)', 
                                      border: '1px solid var(--border-color)',
                                      opacity: snapshot.isDragging ? 0.9 : 1,
                                      ...provided.draggableProps.style 
                                    }}
                                  >
                                    {section.type === 'links' ? (
                                      <div className="flex gap-2 items-start w-full">
                                        <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', paddingTop: '0.45rem' }}>
                                          <GripVertical size={16} color="var(--text-muted)" />
                                        </div>
                                        <div className="flex-col gap-2" style={{ flex: 1, minWidth: 0 }}>
                                          <div className="flex-col w-full">
                                            <LocalLangTabs />
                                            <input type="text" className="input-field" value={getVal(item.title)} onChange={(e) => {
                                              const newItems = [...section.data.items]; 
                                              const prev = newItems[i].title;
                                              newItems[i].title = typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value };
                                              updateSectionData(section.id, { items: newItems });
                                            }} placeholder="Link Title" />
                                          </div>
                                          <input type="text" className="input-field" value={item.url} onChange={(e) => {
                                            const newItems = [...section.data.items]; newItems[i].url = e.target.value; updateSectionData(section.id, { items: newItems });
                                          }} placeholder="URL" />
                                        </div>
                                        <button
                                          type="button"
                                          aria-label="Linkni o‘chirish"
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onClick={() => removeSectionItem(section.id, i)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.35rem', flexShrink: 0, alignSelf: 'flex-start' }}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    ) : section.type === 'contact' ? (
                                      <div className="flex-col gap-2 w-full">
                                        <div className="flex gap-2 items-center">
                                          <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex' }}>
                                            <GripVertical size={16} color="var(--text-muted)" />
                                          </div>
                                          <select 
                                            className="input-field" 
                                            style={{ width: '100px' }}
                                            value={item.type}
                                            onChange={(e) => {
                                              const newItems = [...section.data.items];
                                              newItems[i].type = e.target.value;
                                              updateSectionData(section.id, { ...section.data, items: newItems });
                                            }}
                                          >
                                            <option value="phone">Phone</option>
                                            <option value="email">Email</option>
                                            <option value="website">Website</option>
                                          </select>
                                          <input 
                                            type="text" 
                                            className="input-field" 
                                            style={{ flex: 1 }}
                                            placeholder={item.type === 'email' ? 'email@example.com' : item.type === 'phone' ? '+998...' : 'https://...'}
                                            value={item.value}
                                            onChange={(e) => {
                                              const newItems = [...section.data.items];
                                              newItems[i].value = e.target.value;
                                              updateSectionData(section.id, { ...section.data, items: newItems });
                                            }}
                                          />
                                          <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem', color: '#ef4444' }}
                                            onClick={() => {
                                              const newItems = section.data.items.filter((_, idx) => idx !== i);
                                              updateSectionData(section.id, { ...section.data, items: newItems });
                                            }}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                        <div className="flex-col gap-1 pl-6">
                                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tugma matni ({activeLang}):</span>
                                          <div className="flex-col w-full">
                                            <LocalLangTabs />
                                            <input 
                                              type="text" 
                                              className="input-field"
                                              value={getVal(item.label)}
                                              onChange={(e) => {
                                                const newItems = [...section.data.items];
                                                const prev = newItems[i].label;
                                                newItems[i].label = typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value };
                                                updateSectionData(section.id, { ...section.data, items: newItems });
                                              }}
                                              placeholder="Tugma nomi"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2 items-center w-full">
                                        <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', flexShrink: 0 }}><GripVertical size={16} color="var(--text-muted)" /></div>
                                        <select className="input-field" style={{ width: '38%', minWidth: 0 }} value={item.platform} onChange={(e) => {
                                            const newItems = [...section.data.items]; newItems[i].platform = e.target.value; updateSectionData(section.id, { items: newItems });
                                        }}>
                                            <option value="twitter">Twitter</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="github">Github</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="telegram">Telegram</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="web">Website</option>
                                        </select>
                                        <input type="text" className="input-field" style={{ flex: 1, minWidth: 0 }} value={item.url} onChange={(e) => {
                                          const newItems = [...section.data.items]; newItems[i].url = e.target.value; updateSectionData(section.id, { items: newItems });
                                        }} placeholder="URL" />
                                        <button
                                          type="button"
                                          aria-label="Ijtimoiy tarmoqni o‘chirish"
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onClick={() => removeSectionItem(section.id, i)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.35rem', flexShrink: 0 }}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}

                    {section.type === 'links' && (
                       <>
                        <button className="btn btn-secondary w-full mt-2" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { items: [...section.data.items, { id: generateId(), title: { uz: 'Yangi', ru: 'Новый', en: 'New' }, url: '' }] })}>+ Add Link</button>
                        <div className="flex items-center gap-2 mt-3">
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tugma matni rangi:</span>
                          <input
                            type="color"
                            value={(section.data.color && section.data.color.trim()) ? section.data.color : (siteData.globalStyle.buttonStyle === 'filled' ? '#ffffff' : siteData.globalStyle.textColor)}
                            onChange={(e) => updateSectionData(section.id, { ...section.data, color: e.target.value })}
                            title="Tugma matni rangi"
                            style={{ width: '36px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}
                            onClick={() => updateSectionData(section.id, { ...section.data, color: '' })}
                          >
                            Tema rangi
                          </button>
                        </div>
                       </>
                    )}

                    {section.type === 'social' && (
                       <button className="btn btn-secondary w-full" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { items: [...section.data.items, { id: generateId(), platform: 'twitter', url: '' }] })}>+ Add Social</button>
                    )}

                    {section.type === 'contact' && (
                       <button className="btn btn-secondary w-full mt-2" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { items: [...(section.data.items || []), { id: generateId(), type: 'phone', value: '', label: { uz: 'Telefon', ru: 'Телефон', en: 'Call' } }] })}>+ Aloqa qo'shish</button>
                    )}

                    {section.type === 'text' && (
                      <div className="flex-col gap-3">
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Matn uslubi</span>
                          <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Joysizlash</span>
                            <div className="flex gap-1">
                              {(['left', 'center', 'right']).map((id) => {
                                const Ico = id === 'left' ? AlignLeft : id === 'center' ? AlignCenter : AlignRight;
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    className={`btn ${(section.data.align || 'center') === id ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.35rem 0.5rem' }}
                                    onClick={() => updateSectionData(section.id, { ...section.data, align: id })}
                                    aria-label={id}
                                  >
                                    <Ico size={16} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2" style={{ gap: '0.5rem' }}>
                            <select
                              className="input-field"
                              style={{ flex: '1 1 120px', minWidth: '100px' }}
                              value={section.data.fontSize || 'base'}
                              onChange={(e) => updateSectionData(section.id, { ...section.data, fontSize: e.target.value })}
                            >
                              <option value="sm">Kichik</option>
                              <option value="base">Oddiy</option>
                              <option value="lg">Katta</option>
                              <option value="xl">Yirik</option>
                              <option value="2xl">Juda yirik</option>
                            </select>
                            <select
                              className="input-field"
                              style={{ flex: '1 1 120px', minWidth: '100px' }}
                              value={section.data.fontWeight || 'normal'}
                              onChange={(e) => updateSectionData(section.id, { ...section.data, fontWeight: e.target.value })}
                            >
                              <option value="normal">Oddiy</option>
                              <option value="medium">O‘rtacha</option>
                              <option value="semibold">Yarim qalin</option>
                              <option value="bold">Qalin</option>
                            </select>
                            <div className="flex items-center gap-2" style={{ flex: '1 1 140px' }}>
                              <input
                                type="color"
                                value={(section.data.color && section.data.color.trim()) ? section.data.color : siteData.globalStyle.textColor}
                                onChange={(e) => updateSectionData(section.id, { ...section.data, color: e.target.value })}
                                title="Matn rangi"
                                style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ fontSize: '0.7rem', padding: '0.35rem 0.5rem' }}
                                onClick={() => updateSectionData(section.id, { ...section.data, color: '' })}
                              >
                                Tema rangi
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex-col gap-2">
                          <div className="flex-col gap-1">
                            <span className="lang-tag w-fit px-2" style={{ fontSize: '0.65rem' }}>O'zbekcha (UZ)</span>
                            <textarea
                              className="input-field"
                              style={{ minHeight: '80px', resize: 'vertical' }}
                              value={getVal(section.data.text, 'uz')}
                              onChange={(e) => {
                                const prev = section.data.text;
                                const newVal = typeof prev === 'object' ? { ...prev, uz: e.target.value } : { uz: e.target.value, ru: prev, en: prev };
                                updateSectionData(section.id, { ...section.data, text: newVal });
                              }}
                              placeholder="Matn (UZ)..."
                            />
                          </div>
                          <div className="flex-col gap-1">
                            <span className="lang-tag w-fit px-2" style={{ fontSize: '0.65rem' }}>Русский (RU)</span>
                            <textarea
                              className="input-field"
                              style={{ minHeight: '80px', resize: 'vertical' }}
                              value={getVal(section.data.text, 'ru')}
                              onChange={(e) => {
                                const prev = section.data.text;
                                const newVal = typeof prev === 'object' ? { ...prev, ru: e.target.value } : { uz: prev, ru: e.target.value, en: prev };
                                updateSectionData(section.id, { ...section.data, text: newVal });
                              }}
                              placeholder="Текст (RU)..."
                            />
                          </div>
                          <div className="flex-col gap-1">
                            <span className="lang-tag w-fit px-2" style={{ fontSize: '0.65rem' }}>English (EN)</span>
                            <textarea
                              className="input-field"
                              style={{ minHeight: '80px', resize: 'vertical' }}
                              value={getVal(section.data.text, 'en')}
                              onChange={(e) => {
                                const prev = section.data.text;
                                const newVal = typeof prev === 'object' ? { ...prev, en: e.target.value } : { uz: prev, ru: prev, en: e.target.value };
                                updateSectionData(section.id, { ...section.data, text: newVal });
                              }}
                              placeholder="Text (EN)..."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {section.type === 'contact' && (
                        <div className="flex items-center gap-2 mt-3">
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tugma matni rangi:</span>
                          <input
                            type="color"
                            value={(section.data.color && section.data.color.trim()) ? section.data.color : (siteData.globalStyle.buttonStyle === 'filled' ? '#ffffff' : siteData.globalStyle.textColor)}
                            onChange={(e) => updateSectionData(section.id, { ...section.data, color: e.target.value })}
                            title="Tugma matni rangi"
                            style={{ width: '36px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}
                            onClick={() => updateSectionData(section.id, { ...section.data, color: '' })}
                          >
                            Tema rangi
                          </button>
                        </div>
                    )}

                    {section.type === 'faq' && (
                      <div className="flex-col gap-2">
                        <MultilingualSectionTitle section={section} />
                        {section.data.items?.map((item, i) => (
                          <div key={item.id} className="flex-col gap-2 p-2" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <div className="flex-col w-full">
                              <LocalLangTabs />
                              <input
                                type="text"
                                className="input-field"
                                value={getVal(item.question)}
                                onChange={(e) => {
                                  const items = [...section.data.items];
                                  const prev = items[i].question;
                                  items[i] = { ...items[i], question: typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value } };
                                  updateSectionData(section.id, { ...section.data, items });
                                }}
                                placeholder="Savol"
                              />
                            </div>
                            <div className="flex-col w-full">
                              <LocalLangTabs />
                              <textarea
                                className="input-field"
                                style={{ minHeight: '72px' }}
                                value={getVal(item.answer)}
                                onChange={(e) => {
                                  const items = [...section.data.items];
                                  const prev = items[i].answer;
                                  items[i] = { ...items[i], answer: typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value } };
                                  updateSectionData(section.id, { ...section.data, items });
                                }}
                                placeholder="Javob"
                              />
                            </div>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => updateSectionData(section.id, { ...section.data, items: section.data.items.filter((_, idx) => idx !== i) })}>
                              O‘chirish
                            </button>
                          </div>
                        ))}
                        <button type="button" className="btn btn-secondary w-full" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { ...section.data, items: [...(section.data.items || []), { id: generateId(), question: '', answer: '' }] })}>
                          + Savol qo‘shish
                        </button>
                      </div>
                    )}

                    {section.type === 'gallery' && (
                      <div className="flex-col gap-2">
                        <MultilingualSectionTitle section={section} />
                        {section.data.items?.map((item, i) => (
                          <div key={item.id} className="flex-col gap-2 p-2" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <input
                              type="text"
                              className="input-field"
                              value={item.url}
                              onChange={(e) => {
                                const items = [...section.data.items];
                                items[i] = { ...items[i], url: e.target.value };
                                updateSectionData(section.id, { ...section.data, items });
                              }}
                              placeholder="Rasm URL (https://...)"
                            />
                            <div className="flex-col w-full">
                              <LocalLangTabs />
                              <input
                                type="text"
                                className="input-field"
                                value={getVal(item.caption)}
                                onChange={(e) => {
                                  const items = [...section.data.items];
                                  const prev = items[i].caption;
                                  items[i] = { ...items[i], caption: typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value } };
                                  updateSectionData(section.id, { ...section.data, items });
                                }}
                                placeholder="Izoh"
                              />
                            </div>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => updateSectionData(section.id, { ...section.data, items: section.data.items.filter((_, idx) => idx !== i) })}>
                              O‘chirish
                            </button>
                          </div>
                        ))}
                        <button type="button" className="btn btn-secondary w-full" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { ...section.data, items: [...(section.data.items || []), { id: generateId(), url: '', caption: '' }] })}>
                          + Rasm
                        </button>
                      </div>
                    )}

                    {section.type === 'video' && (
                      <div className="flex-col gap-2">
                        <MultilingualSectionTitle section={section} />
                        <input
                          type="text"
                          className="input-field"
                          value={section.data.youtubeUrl || ''}
                          onChange={(e) => updateSectionData(section.id, { ...section.data, youtubeUrl: e.target.value })}
                          placeholder="YouTube havola (watch yoki youtu.be)"
                        />
                      </div>
                    )}

                    {section.type === 'hours' && (
                      <div className="flex-col gap-2">
                        <MultilingualSectionTitle section={section} />
                        {section.data.lines?.map((line, i) => (
                          <div key={line.id} className="flex gap-2 items-center">
                            <div className="flex-col w-full" style={{ flex: 1 }}>
                              <LocalLangTabs />
                              <input
                                type="text"
                                className="input-field"
                                style={{ flex: 1 }}
                                value={getVal(line.label)}
                                onChange={(e) => {
                                  const lines = [...section.data.lines];
                                  const prev = lines[i].label;
                                  lines[i] = { ...lines[i], label: typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value } };
                                  updateSectionData(section.id, { ...section.data, lines });
                                }}
                                placeholder="Kun / yozuv"
                              />
                            </div>
                            <input
                              type="text"
                              className="input-field"
                              style={{ flex: 1 }}
                              value={line.value}
                              onChange={(e) => {
                                const lines = [...section.data.lines];
                                lines[i] = { ...lines[i], value: e.target.value };
                                updateSectionData(section.id, { ...section.data, lines });
                              }}
                              placeholder="Vaqt"
                            />
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => updateSectionData(section.id, { ...section.data, lines: section.data.lines.filter((_, idx) => idx !== i) })}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button type="button" className="btn btn-secondary w-full" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { ...section.data, lines: [...(section.data.lines || []), { id: generateId(), label: '', value: '' }] })}>
                          + Qator
                        </button>
                      </div>
                    )}

                    {section.type === 'downloads' && (
                      <div className="flex-col gap-3">
                        <div>
                          <span className="downloads-pdf-field-label">Blok sarlavhasi</span>
                          <input
                            type="text"
                            className="input-field downloads-pdf-input"
                            value={section.data.title || ''}
                            onChange={(e) => updateSectionData(section.id, { ...section.data, title: e.target.value })}
                            placeholder="Masalan: Fayllar, Hujjatlar"
                          />
                        </div>
                        {pdfQuota && pdfQuota.limitBytes > 0 && (
                          <div className="downloads-pdf-quota-pill">
                            <span>
                              Jami Blob PDF: {(pdfQuota.usedBytes / (1024 * 1024)).toFixed(1)} /{' '}
                              {(pdfQuota.limitBytes / (1024 * 1024)).toFixed(0)} MB
                            </span>
                          </div>
                        )}
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                          Chapdagi katak yoki «PDF tanlash» — fayl yuklash. O‘ngdagi qatorlar — nom, havola, tur.
                        </p>
                        {section.data.items?.map((item, i) => {
                          const pdfRowKey = `${section.id}-${i}`;
                          const delKey = `${section.id}-${item.id}`;
                          const pdfInputId = `pdf-upload-${section.id}-${item.id}`;
                          const pdfBusy = pdfUpload?.key === pdfRowKey;
                          const rowBusy = pdfBusy || downloadDeleting === delKey;
                          const hasPdfFile =
                            !!(item.url && String(item.url).trim()) &&
                            ((item.fileType || '').toLowerCase() === 'pdf' ||
                              String(item.url).toLowerCase().split('?')[0].endsWith('.pdf'));
                          return (
                          <div key={item.id} className="downloads-pdf-card flex-col gap-3">
                            <div className="flex items-center justify-between gap-2" style={{ flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                                PDF #{i + 1}
                              </span>
                              {editSlug ? (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>O‘chirish — DB yangilanadi</span>
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Qoralama</span>
                              )}
                            </div>
                            <div className="flex items-start gap-3" style={{ flexWrap: 'wrap' }}>
                              <label
                                htmlFor={pdfInputId}
                                className={`downloads-pdf-drop ${rowBusy ? 'downloads-pdf-drop--busy' : ''}`}
                                style={{
                                  width: 88,
                                  height: 88,
                                  borderRadius: 12,
                                  border: '2px dashed var(--border-color)',
                                  background: 'var(--bg-secondary)',
                                  cursor: rowBusy ? 'wait' : 'pointer',
                                  overflow: 'hidden',
                                }}
                              >
                                {pdfBusy ? (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'rgba(255,255,255,0.88)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.25rem',
                                      borderRadius: 10,
                                      zIndex: 1,
                                    }}
                                  >
                                    <Loader2 size={22} className="qr-animate-spin" aria-hidden style={{ color: 'var(--text-primary)' }} />
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                      {pdfUpload.progress > 0 ? `${pdfUpload.progress}%` : ''}
                                    </span>
                                  </div>
                                ) : null}
                                <div
                                  className="flex-col items-center justify-center"
                                  style={{
                                    height: '100%',
                                    padding: '0.5rem',
                                    gap: '0.25rem',
                                    textAlign: 'center',
                                  }}
                                >
                                  {hasPdfFile ? (
                                    <>
                                      <FileText size={26} strokeWidth={1.75} style={{ color: 'var(--primary-color)' }} aria-hidden />
                                      <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Yuklangan</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileUp size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} aria-hidden />
                                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Tanlash</span>
                                    </>
                                  )}
                                </div>
                              </label>
                              <div className="flex-col gap-2" style={{ flex: 1, minWidth: '200px' }}>
                                <div>
                                  <div className="flex-col w-full">
                                    <LocalLangTabs />
                                    <input
                                      type="text"
                                      className="input-field downloads-pdf-input"
                                      value={getVal(item.title)}
                                      disabled={rowBusy}
                                      onChange={(e) => {
                                        const items = [...section.data.items];
                                        const prev = items[i].title;
                                        items[i] = { ...items[i], title: typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value } };
                                        updateSectionData(section.id, { ...section.data, items });
                                      }}
                                      placeholder="Masalan: Katalog 2025"
                                    />
                                  </div>
                                </div>
                                <label
                                  htmlFor={pdfInputId}
                                  className="btn btn-secondary"
                                  style={{
                                    fontSize: '0.8rem',
                                    padding: '0.5rem 0.75rem',
                                    cursor: rowBusy ? 'wait' : 'pointer',
                                    alignSelf: 'flex-start',
                                    pointerEvents: rowBusy ? 'none' : 'auto',
                                  }}
                                >
                                  PDF tanlash
                                </label>
                                <input
                                  id={pdfInputId}
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  disabled={rowBusy}
                                  style={{ display: 'none' }}
                                  aria-label={`PDF #${i + 1} tanlash`}
                                  onChange={(ev) => { void handleDownloadsPdfPick(section.id, i, ev); }}
                                />
                                <div>
                                  <span className="downloads-pdf-field-label">Tashqi havola (ixtiyoriy)</span>
                                  <input
                                    type="text"
                                    className="input-field downloads-pdf-input"
                                    value={item.url}
                                    disabled={rowBusy}
                                    onChange={(e) => {
                                      const items = [...section.data.items];
                                      const { sizeBytes: _sb, ...rest } = items[i];
                                      items[i] = { ...rest, url: e.target.value };
                                      updateSectionData(section.id, { ...section.data, items });
                                    }}
                                    placeholder="https://…"
                                  />
                                </div>
                                <div>
                                  <span className="downloads-pdf-field-label">Turi</span>
                                  <input
                                    type="text"
                                    className="input-field downloads-pdf-input"
                                    value={item.fileType || ''}
                                    disabled={rowBusy}
                                    onChange={(e) => {
                                      const items = [...section.data.items];
                                      items[i] = { ...items[i], fileType: e.target.value };
                                      updateSectionData(section.id, { ...section.data, items });
                                    }}
                                    placeholder="PDF, vCard, …"
                                  />
                                </div>
                                <p className="downloads-pdf-hint">Maksimal fayl hajmi: 20 MB (Vercel Blob).</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary w-full"
                              style={{
                                fontSize: '0.75rem',
                                borderColor: '#fecaca',
                                color: '#b91c1c',
                                background: '#fef2f2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                              }}
                              disabled={rowBusy}
                              onClick={() => { void handleRemoveDownloadsRow(section.id, item.id, i); }}
                            >
                              {downloadDeleting === delKey ? (
                                <>
                                  <Loader2 size={14} className="qr-animate-spin" aria-hidden />
                                  O‘chirilmoqda…
                                </>
                              ) : (
                                `Shu PDF ni o‘chirish (#${i + 1})`
                              )}
                            </button>
                          </div>
                          );
                        })}
                        <button
                          type="button"
                          className="btn btn-secondary w-full"
                          style={{ fontSize: '0.75rem', borderStyle: 'dashed' }}
                          onClick={() =>
                            updateSectionData(section.id, {
                              ...section.data,
                              items: [...(section.data.items || []), { id: generateId(), title: { uz: 'Yangi fayl', ru: 'Новый файл', en: 'New file' }, url: '', fileType: '' }],
                            })}
                        >
                          <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                          Yana bir PDF qatori
                        </button>
                      </div>
                    )}

                    {section.type === 'quick_actions' && (
                      <div className="flex-col gap-2">
                        <MultilingualSectionTitle section={section} />
                        {section.data.items?.map((item, i) => (
                          <div key={item.id} className="flex-col gap-2 p-2" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <select
                              className="input-field"
                              value={item.type || 'custom'}
                              onChange={(e) => {
                                const items = [...section.data.items];
                                items[i] = { ...items[i], type: e.target.value };
                                updateSectionData(section.id, { ...section.data, items });
                              }}
                            >
                              <option value="whatsapp">WhatsApp</option>
                              <option value="telegram">Telegram</option>
                              <option value="calendar">Google Calendar / bron</option>
                              <option value="custom">Havola</option>
                            </select>
                            <div className="flex-col w-full">
                              <LocalLangTabs />
                              <input
                                type="text"
                                className="input-field"
                                value={getVal(item.label)}
                                onChange={(e) => {
                                  const items = [...section.data.items];
                                  const prev = items[i].label;
                                  items[i] = { ...items[i], label: typeof prev === 'object' ? { ...prev, [activeLang]: e.target.value } : { uz: prev, ru: prev, en: prev, [activeLang]: e.target.value } };
                                  updateSectionData(section.id, { ...section.data, items });
                                }}
                                placeholder="Tugma yozuvi"
                              />
                            </div>
                            <input
                              type="text"
                              className="input-field"
                              value={item.value || ''}
                              onChange={(e) => {
                                const items = [...section.data.items];
                                items[i] = { ...items[i], value: e.target.value };
                                updateSectionData(section.id, { ...section.data, items });
                              }}
                              placeholder={item.type === 'whatsapp' ? 'Telefon (998...)' : item.type === 'telegram' ? '@username' : 'https://...'}
                            />
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => updateSectionData(section.id, { ...section.data, items: section.data.items.filter((_, idx) => idx !== i) })}>
                              O‘chirish
                            </button>
                          </div>
                        ))}
                        <button type="button" className="btn btn-secondary w-full" style={{ fontSize: '0.75rem' }} onClick={() => updateSectionData(section.id, { ...section.data, items: [...(section.data.items || []), { id: generateId(), type: 'whatsapp', label: { uz: 'WhatsApp', ru: 'WhatsApp', en: 'WhatsApp' }, value: '' }] })}>
                          + Tugma
                        </button>
                        <div className="flex items-center gap-2 mt-3">
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tugma matni rangi:</span>
                          <input
                            type="color"
                            value={(section.data.color && section.data.color.trim()) ? section.data.color : (siteData.globalStyle.buttonStyle === 'filled' ? '#ffffff' : siteData.globalStyle.textColor)}
                            onChange={(e) => updateSectionData(section.id, { ...section.data, color: e.target.value })}
                            title="Tugma matni rangi"
                            style={{ width: '36px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }}
                            onClick={() => updateSectionData(section.id, { ...section.data, color: '' })}
                          >
                            Tema rangi
                          </button>
                        </div>
                      </div>
                    )}

                    {section.type === 'map' && (
                      <div className="flex-col gap-2">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Xarita manbai</span>
                        <select
                          className="input-field"
                          value={section.data.mapProvider || 'google'}
                          onChange={(e) => updateSectionData(section.id, { ...section.data, mapProvider: e.target.value })}
                        >
                          <option value="google">Google Maps</option>
                          <option value="yandex">Yandex Xaritalar</option>
                        </select>
                        <input
                          type="text"
                          className="input-field"
                          value={section.data.title || ''}
                          onChange={(e) => updateSectionData(section.id, { ...section.data, title: e.target.value })}
                          placeholder="Sarlavha (masalan: Bizning ofis)"
                        />
                        <textarea
                          className="input-field"
                          style={{ minHeight: '96px', resize: 'vertical', fontSize: '0.8rem' }}
                          value={section.data.embedUrl || ''}
                          onChange={(e) => {
                            const src = extractMapEmbedSrc(e.target.value);
                            updateSectionData(section.id, { ...section.data, embedUrl: src });
                          }}
                          placeholder="Google: Xarita → Ulashish → Xaritani joylashtirish → src havolasi. Yandex: Xarita → Ulashish → HTML. Iframe yoki faqat https://... havolani qo‘ying."
                        />
                        {section.data.embedUrl && !isAllowedMapEmbedUrl(section.data.embedUrl) && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', lineHeight: 1.4 }}>
                            Havola Google Maps embed (maps/embed) yoki Yandex map-widget bo‘lishi kerak.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
                
              <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('links')}><Plus size={14}/> Links</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('social')}><Plus size={14}/> Social</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('quick_actions')}><Plus size={14}/> Tezkor</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('text')}><Plus size={14}/> Text</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('faq')}><Plus size={14}/> FAQ</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('gallery')}><Plus size={14}/> Gallery</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('video')}><Plus size={14}/> Video</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('hours')}><Plus size={14}/> Vaqt</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('downloads')}><Plus size={14}/> Fayl</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('contact')}><Plus size={14}/> Contact</button>
                  <button className="btn btn-secondary flex-1" onClick={() => addSection('map')}><MapPin size={14}/> Location</button>
                </div>
              </div>
            </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <div className="editor-section">
              <span className="label">SEO va ulashish</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
                Jonli sahifa sarlavhasi, tavsif va ijtimoiy tarmoqlarda rasm (og:image).
              </p>
              <div className="flex-col gap-3 mt-2">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Brauzer tab / og:title"
                  value={(siteData.seo || {}).pageTitle || ''}
                  onChange={(e) => handleSeoChange('pageTitle', e.target.value)}
                />
                <textarea
                  className="input-field"
                  style={{ minHeight: '72px' }}
                  placeholder="Qisqa tavsif (meta description)"
                  value={(siteData.seo || {}).description || ''}
                  onChange={(e) => handleSeoChange('description', e.target.value)}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="og:image URL (https://...)"
                  value={(siteData.seo || {}).ogImage || ''}
                  onChange={(e) => handleSeoChange('ogImage', e.target.value)}
                />
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Maxfiylik va muddat</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
                Parol bilan himoya serverda saqlanadi. Muddat tugagach sahifa 410 qaytaradi.
              </p>
              <div className="flex-col gap-3 mt-2">
                <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={!!(siteData.privacy || {}).enabled}
                    onChange={(e) => handlePrivacyChange('enabled', e.target.checked)}
                  />
                  Maxfiy sahifa (parol)
                </label>
                {(siteData.privacy || {}).enabled && (
                  <>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Parol (saqlashda yangilanadi; bo‘sh = eski parol saqlanadi)"
                      value={(siteData.privacy || {}).password || ''}
                      onChange={(e) => handlePrivacyChange('password', e.target.value)}
                      autoComplete="new-password"
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Yangi sayt yoki birinchi marta yoqishda parol majburiy.
                    </span>
                  </>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Havola muddati (ixtiyoriy)</span>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={(siteData.privacy || {}).expiresAt || ''}
                  onChange={(e) => handlePrivacyChange('expiresAt', e.target.value)}
                />
                {(siteData.privacy || {}).expiresAt && (
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => handlePrivacyChange('expiresAt', '')}>
                    Muddatni olib tashlash
                  </button>
                )}
              </div>
            </div>

            <div className="editor-section">
              <span className="label">Import / eksport</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem' }}>
                Loyihani JSON fayl sifatida zaxiralang yoki qayta yuklang.
              </p>
              <div className="flex-col gap-2">
                <button type="button" className="btn btn-secondary w-full" onClick={exportSiteJson}>
                  JSON eksport
                </button>
                <label className="btn btn-secondary w-full" style={{ cursor: 'pointer', textAlign: 'center' }}>
                  JSON import
                  <input type="file" accept="application/json,.json" onChange={importSiteJson} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Container */}
      <div className="preview-container" style={{ background: '#e4e4e7', backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        <div className="preview-toolbar">
          <button className={`btn ${previewMode === 'desktop' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem' }} onClick={() => setPreviewMode('desktop')} title="Desktop View"><Monitor size={18} /></button>
          <button className={`btn ${previewMode === 'mobile' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem' }} onClick={() => setPreviewMode('mobile')} title="Mobile View"><Smartphone size={18} /></button>
        </div>

        <div className={`preview-wrapper ${previewMode}`}>
          <iframe ref={iframeRef} src="/preview" title="Live Preview" style={{ width: '100%', height: '100%', border: 'none' }} onLoad={handleIframeLoad} />
        </div>
      </div>

      {/* Publish Modal */}
      {publishModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '480px', maxWidth: '90%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setPublishModal({ open: false, slug: '', copied: false })}><X size={24} /></button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Saytni saqlash</h2>
            
            {!publishModal.publishedUrl ? (
              <>
                <div>
                  <span className="label">URL manzil (slug)</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/</span>
                    <input
                      type="text"
                      className="input-field"
                      readOnly={!!editSlug}
                      value={publishModal.slug}
                      onChange={(e) => setPublishModal({ ...publishModal, slug: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                    />
                  </div>
                  {editSlug && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                      Tahrirlash rejimida slug o‘zgarmaydi.
                    </p>
                  )}
                </div>
                                <button 
                  className="btn btn-primary w-full" 
                  style={{ padding: '0.75rem', fontSize: '1rem', opacity: publishModal.isPublishing ? 0.7 : 1 }} 
                  onClick={confirmPublish}
                  disabled={publishModal.isPublishing}
                >
                  {publishModal.isPublishing ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>

              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Check size={20} /><span>Sayt saqlandi!</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      background: (siteData.qrStyle || defaultQrStyle).bgColor,
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <QRCodeCanvas
                      id="qr-canvas"
                      value={publishModal.publishedUrl}
                      size={(siteData.qrStyle || defaultQrStyle).size}
                      level={(siteData.qrStyle || defaultQrStyle).level}
                      bgColor={(siteData.qrStyle || defaultQrStyle).bgColor}
                      fgColor={(siteData.qrStyle || defaultQrStyle).fgColor}
                      includeMargin={(siteData.qrStyle || defaultQrStyle).includeMargin !== false}
                      imageSettings={publishQrImageSettings()}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center w-full">
                    <button type="button" className="btn btn-secondary" onClick={downloadQRCode} style={{ fontSize: '0.875rem' }}>
                      PNG yuklash
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={downloadQrSvg} style={{ fontSize: '0.875rem' }}>
                      SVG yuklash
                    </button>
                  </div>
                  <div ref={qrSvgExportRef} style={{ position: 'absolute', left: -9999, top: 0, width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
                    <QRCodeSVG
                      value={publishModal.publishedUrl || ''}
                      size={(siteData.qrStyle || defaultQrStyle).size}
                      level={(siteData.qrStyle || defaultQrStyle).level}
                      bgColor={(siteData.qrStyle || defaultQrStyle).bgColor}
                      fgColor={(siteData.qrStyle || defaultQrStyle).fgColor}
                      includeMargin={(siteData.qrStyle || defaultQrStyle).includeMargin !== false}
                      imageSettings={publishQrImageSettings()}
                    />
                  </div>
                </div>
                <div className="w-full flex items-center justify-between p-2" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                  <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px', color: 'var(--text-secondary)' }}>{publishModal.publishedUrl}</span>
                  <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }} onClick={() => { navigator.clipboard.writeText(publishModal.publishedUrl); setPublishModal({ ...publishModal, copied: true }); }}>
                    {publishModal.copied ? <Check size={16}/> : <Share size={16}/>}
                  </button>
                </div>
                <a className="btn btn-secondary w-full" href={`/${publishModal.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Open Live Site <ExternalLink size={16} /></a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
