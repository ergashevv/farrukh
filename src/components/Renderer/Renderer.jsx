import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ensureSiteAosInitialized, syncSiteAos } from '../../core/aosBootstrap';
import { Link as LinkIcon, Mail, Phone, ExternalLink, MapPin, Calendar, MessageCircle, Globe, Languages } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { isAllowedMapEmbedUrl } from '../../core/mapEmbed';
import { getTextSectionRenderStyle, getProfileFieldStyle } from '../../core/textSectionStyle';
import { extractYoutubeVideoId } from '../../core/youtubeEmbed';

const TwitterIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5 2.8 12 3 12c.5.1 1.1.2 1.6.1-2.4-1.3-3.2-4.1-3.2-4.1.5.3 1.1.4 1.7.4-1.5-1-2.4-3-1.6-4.9 2.5 3 6.3 4.9 10.6 5.1C11.5 5.5 14 3.5 16.5 4.5c1.1.4 2.1 1.1 2.8 2 .9-.2 1.8-.6 2.7-1.1-.3 1-.9 1.8-1.7 2.3.8-.1 1.6-.3 2.3-.6Z"></path>
  </svg>
);

const InstagramIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const GithubIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
    <path d="M9 18c-4.51 2-5-2-7-2"></path>
  </svg>
);

const TelegramIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 2L11 13"></path>
    <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
  </svg>
);

const LinkedinIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const getIcon = (platform, props) => {
  switch (platform?.toLowerCase()) {
    case 'twitter': return <TwitterIcon {...props} />;
    case 'instagram': return <InstagramIcon {...props} />;
    case 'github': return <GithubIcon {...props} />;
    case 'telegram': return <TelegramIcon {...props} />;
    case 'linkedin': return <LinkedinIcon {...props} />;
    case 'youtube': return <YoutubeIcon {...props} />;
    case 'whatsapp': return <MessageCircle {...props} />;
    case 'mail': return <Mail {...props} />;
    case 'phone': return <Phone {...props} />;
    case 'web':
    case 'website': return <Globe {...props} />;
    default: return <LinkIcon {...props} />;
  }
};

export const Renderer = ({ data, onReorder, siteSlug }) => {
  const { globalStyle, content } = data;
  const aosAnim = globalStyle.scrollAnimation || 'none';
  const aosRequested = aosAnim !== 'none';

  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const aosActive = aosRequested && !reduceMotion;

  const aosAttrs = (delay = 0) =>
    aosActive
      ? {
          'data-aos': aosAnim,
          'data-aos-once': 'true',
          'data-aos-duration': '720',
          'data-aos-easing': 'ease-out-sine',
          'data-aos-anchor-placement': 'center-bottom',
          ...(delay > 0 ? { 'data-aos-delay': String(Math.min(delay, 420)) } : {}),
        }
      : {};

  const sectionIdsKey = content?.sections?.map((s) => s.id).join('|') ?? '';

  useLayoutEffect(() => {
    if (!aosActive) return undefined;
    ensureSiteAosInitialized();
    syncSiteAos();
    return undefined;
  }, [aosActive, aosAnim, sectionIdsKey]);

  const fireTrack = (targetKey) => {
    if (!siteSlug || !targetKey) return;
    fetch('/api/site-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: siteSlug, event: 'click', targetKey }),
    }).catch(() => {});
  };

  const isPattern = globalStyle.backgroundImage?.includes('data:image/svg');
  // fixed attachment breaks tiled/cover backgrounds on mobile Safari (pattern stops mid-scroll)
  const bgStyle = globalStyle.backgroundImage
    ? {
        backgroundColor: globalStyle.backgroundColor,
        backgroundImage: globalStyle.backgroundImage,
        backgroundSize: isPattern ? 'auto' : 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: isPattern ? 'repeat' : 'no-repeat',
        backgroundAttachment: 'scroll',
      }
    : globalStyle.backgroundGradient
      ? { background: globalStyle.backgroundGradient }
      : { backgroundColor: globalStyle.backgroundColor };

  const [activeLang, setActiveLang] = useState(data.lang || 'uz');

  const t = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[activeLang] || field['uz'] || field['en'] || field['ru'] || '';
  };

  const containerStyle = {
    ...bgStyle,
    minHeight: '100vh',
    width: '100%',
    fontFamily: globalStyle.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Inter", sans-serif',
    color: globalStyle.textColor,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem',
    paddingTop: '3rem',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  };

  const maxW = { maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' };

  const getBtnStyle = () => {
    const base = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '1rem',
      marginBottom: '1rem',
      borderRadius: globalStyle.borderRadius,
      textDecoration: 'none',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      position: 'relative'
    };

    switch (globalStyle.buttonStyle) {
      case 'outline': return { ...base, backgroundColor: 'transparent', border: `2px solid ${globalStyle.primaryColor}`, color: globalStyle.textColor };
      case 'soft': return { ...base, backgroundColor: `${globalStyle.primaryColor}20`, color: globalStyle.primaryColor, border: 'none' };
      case 'glass': return { ...base, backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.3)', color: globalStyle.textColor, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
      default: return { ...base, backgroundColor: globalStyle.primaryColor, color: '#ffffff', border: 'none' };
    }
  };

  const renderSection = (section) => {
    switch(section.type) {
      case 'social':
        return (
          <div key={section.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {section.data.items?.map(s => (
              <a 
                key={s.id} href={s.url} target="_blank" rel="noreferrer"
                style={{ color: globalStyle.textColor, transition: 'opacity 0.2s', opacity: 0.8 }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
                onClick={() => fireTrack(`social:${section.id}:${s.id}`)}
              >
                {getIcon(s.platform, { size: 28 })}
              </a>
            ))}
          </div>
        );
      case 'links':
        return (
          <div key={section.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
            {section.data.items?.map(link => (
              <a 
                key={link.id} href={link.url} target="_blank" rel="noreferrer" 
                style={{
                  ...getBtnStyle(),
                  color: section.data.color || (globalStyle.buttonStyle === 'filled' ? '#ffffff' : globalStyle.textColor)
                }}
                onClick={() => fireTrack(`link:${section.id}:${link.id}`)}
                onMouseOver={(e) => {
                  if(globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = globalStyle.primaryColor; e.currentTarget.style.color = '#fff'; }
                  else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '0.9'; }
                  else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }
                }}
                onMouseOut={(e) => {
                  if(globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = section.data.color || globalStyle.textColor; }
                  else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '1'; }
                  else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }
                }}
              >
                {t(link.title)}
              </a>
            ))}
          </div>
        );
      case 'contact':
        return (
          <div key={section.id} style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
             {section.data.items?.map((item) => {
               const isEmail = item.type === 'email';
               const isPhone = item.type === 'phone';
               const href = isEmail 
                 ? `mailto:${item.value}` 
                 : isPhone 
                   ? `tel:${item.value}` 
                   : (item.value?.startsWith('http') ? item.value : `https://${item.value}`);
               
               const icon = isEmail ? <Mail size={18} style={{ marginRight: '0.5rem' }} /> : isPhone ? <Phone size={18} style={{ marginRight: '0.5rem' }} /> : <ExternalLink size={18} style={{ marginRight: '0.5rem' }} />;

               if (!item.value) return null;

               return (
                 <a 
                   key={item.id}
                   href={href}
                   target={!isEmail && !isPhone ? "_blank" : undefined}
                   rel={!isEmail && !isPhone ? "noreferrer" : undefined}
                   style={{
                     ...getBtnStyle(), 
                     flex: (isEmail || isPhone) ? '1 1 45%' : '1 1 100%', 
                     margin: 0, 
                     color: section.data.color || (globalStyle.buttonStyle === 'filled' ? '#ffffff' : globalStyle.textColor)
                   }} 
                   onClick={() => fireTrack(`contact:${section.id}:${item.id}`)}
                 >
                   {icon} {t(item.label)}
                 </a>
               );
             })}
          </div>
        );
      case 'text':
        return (
           <div
             key={section.id}
             style={{
               width: '100%',
               marginBottom: '1.5rem',
               ...getTextSectionRenderStyle(section.data, globalStyle),
             }}
           >
              {section.data.text}
           </div>
        );
      case 'map': {
        const raw = section.data.embedUrl?.trim() || '';
        const safeSrc = isAllowedMapEmbedUrl(raw) ? raw : null;
        if (!safeSrc) return null;
        const provider = section.data.mapProvider || 'google';
        const accent = provider === 'yandex' ? '#fc3f1e' : globalStyle.primaryColor;
        return (
          <div key={section.id} style={{ width: '100%', marginBottom: '1.5rem' }}>
            {section.data.title && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: globalStyle.textColor,
                  opacity: 0.95
                }}
              >
                <MapPin size={18} style={{ color: accent, flexShrink: 0 }} aria-hidden />
                <span>{t(section.data.title)}</span>
              </div>
            )}
            <div
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: globalStyle.borderRadius,
                overflow: 'hidden',
                boxShadow: globalStyle.buttonStyle === 'glass'
                  ? '0 8px 32px rgba(0,0,0,0.12)'
                  : '0 4px 24px rgba(0,0,0,0.08)',
                border: `1px solid ${globalStyle.buttonStyle === 'glass' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.08)'}`,
                background: globalStyle.buttonStyle === 'glass' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.04)',
                aspectRatio: '16 / 10',
                minHeight: '200px',
                maxHeight: 'min(56vh, 420px)'
              }}
            >
              <iframe
                title={section.data.title || 'Xarita'}
                src={safeSrc}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                  display: 'block'
                }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        );
      }
      case 'faq':
        return (
          <div key={section.id} style={{ width: '100%', marginBottom: '1.5rem' }}>
            {section.data.title && (
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>{t(section.data.title)}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              {section.data.items?.map((item) => (
                <details
                  key={item.id}
                  style={{
                    borderRadius: globalStyle.borderRadius,
                    border: `1px solid ${globalStyle.buttonStyle === 'glass' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)'}`,
                    background: globalStyle.buttonStyle === 'glass' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.03)',
                    padding: '0.5rem 0.75rem',
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{item.question}</summary>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9375rem', opacity: 0.95, lineHeight: 1.5 }}>{item.answer}</div>
                </details>
              ))}
            </div>
          </div>
        );
      case 'gallery':
        return (
          <div key={section.id} style={{ width: '100%', marginBottom: '1.5rem' }}>
            {section.data.title && (
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>{t(section.data.title)}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', width: '100%' }}>
              {section.data.items?.map((item) => (
                <figure key={item.id} style={{ margin: 0 }}>
                  <img
                    src={item.url}
                    alt={item.caption || ''}
                    loading="lazy"
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: globalStyle.borderRadius, display: 'block' }}
                  />
                  {item.caption && (
                    <figcaption style={{ fontSize: '0.75rem', marginTop: '0.25rem', textAlign: 'center', opacity: 0.85 }}>{item.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        );
      case 'video': {
        const vid = extractYoutubeVideoId(section.data.youtubeUrl || '');
        if (!vid) return null;
        return (
          <div key={section.id} style={{ width: '100%', marginBottom: '1.5rem' }}>
            {section.data.title && (
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>{t(section.data.title)}</div>
            )}
            <div
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: globalStyle.borderRadius,
                overflow: 'hidden',
                aspectRatio: '16 / 9',
                background: '#0f0f0f',
              }}
            >
              <iframe
                title={section.data.title || 'Video'}
                src={`https://www.youtube-nocookie.com/embed/${vid}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        );
      }
      case 'hours':
        return (
          <div
            key={section.id}
            style={{
              width: '100%',
              marginBottom: '1.5rem',
              padding: '1rem 1.25rem',
              borderRadius: globalStyle.borderRadius,
              border: `1px solid ${globalStyle.buttonStyle === 'glass' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)'}`,
              background: globalStyle.buttonStyle === 'glass' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
              boxSizing: 'border-box',
            }}
          >
            {section.data.title && (
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>{t(section.data.title)}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {section.data.lines?.map((line) => (
                <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.9375rem' }}>
                  <span style={{ opacity: 0.9 }}>{line.label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>{line.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'downloads':
        return (
          <div key={section.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
            {section.data.title && (
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>{t(section.data.title)}</div>
            )}
            {section.data.items?.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={getBtnStyle()}
                onClick={() => fireTrack(`download:${section.id}:${item.id}`)}
                onMouseOver={(e) => {
                  if (globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = globalStyle.primaryColor; e.currentTarget.style.color = '#fff'; }
                  else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '0.9'; }
                  else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }
                }}
                onMouseOut={(e) => {
                  if (globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = globalStyle.textColor; }
                  else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '1'; }
                  else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }
                }}
              >
                <ExternalLink size={18} style={{ marginRight: '0.5rem' }} />
                {item.title}
                {item.fileType ? ` · ${item.fileType}` : ''}
              </a>
            ))}
          </div>
        );
      case 'quick_actions': {
        const hrefFor = (type, value) => {
          const v = (value || '').trim();
          if (!v) return '#';
          if (type === 'whatsapp') {
            const digits = v.replace(/\D/g, '');
            return digits ? `https://wa.me/${digits}` : '#';
          }
          if (type === 'telegram') {
            const u = v.replace(/^@/, '');
            return u ? `https://t.me/${u}` : '#';
          }
          if (type === 'calendar') {
            return /^https?:\/\//i.test(v) ? v : `https://${v}`;
          }
          return /^https?:\/\//i.test(v) ? v : `https://${v}`;
        };
        const iconFor = (type) => {
          if (type === 'whatsapp') return <MessageCircle size={20} style={{ marginRight: '0.5rem' }} />;
          if (type === 'telegram') return <TelegramIcon size={20} style={{ marginRight: '0.5rem' }} />;
          if (type === 'calendar') return <Calendar size={20} style={{ marginRight: '0.5rem' }} />;
          return <ExternalLink size={20} style={{ marginRight: '0.5rem' }} />;
        };
        return (
          <div key={section.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
            {section.data.title && (
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center', width: '100%' }}>{t(section.data.title)}</div>
            )}
            {section.data.items?.map((item) => {
              const href = hrefFor(item.type, item.value);
              const lab = item.label || (item.type === 'whatsapp' ? 'WhatsApp' : item.type === 'telegram' ? 'Telegram' : item.type === 'calendar' ? 'Bron qilish' : 'Havola');
              return (
                <a
                  key={item.id}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...getBtnStyle(),
                    color: section.data.color || (globalStyle.buttonStyle === 'filled' ? '#ffffff' : globalStyle.textColor)
                  }}
                  onClick={() => fireTrack(`quick:${section.id}:${item.id}`)}
                  onMouseOver={(e) => {
                    if (globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = globalStyle.primaryColor; e.currentTarget.style.color = '#fff'; }
                    else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '0.9'; }
                    else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }
                  }}
                  onMouseOut={(e) => {
                    if (globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = section.data.color || globalStyle.textColor; }
                    else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '1'; }
                    else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }
                  }}
                >
                  {iconFor(item.type)}
                  {lab}
                </a>
              );
            })}
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div style={containerStyle} className="site-renderer-container">
      <div style={maxW}>
        {/* Header Buttons */}
        {globalStyle.headerButtons && globalStyle.headerButtons.length > 0 && (
          <div style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {globalStyle.headerButtons.map(btn => (
              <a 
                key={btn.id} 
                href={btn.url} 
                className="header-btn"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: globalStyle.borderRadius,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: `1px solid ${globalStyle.primaryColor}40`,
                  color: globalStyle.textColor,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = globalStyle.primaryColor;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = globalStyle.textColor;
                }}
              >
                {t(btn.label)}
              </a>
            ))}
          </div>
        )}

        {content.avatar && (
          <img 
            src={content.avatar} alt={content.title || 'Avatar'}
            loading="eager"
            decoding="async"
            {...aosAttrs(0)}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: ((content.avatarShape || 'circle') === 'square' ? '16px' : '50%'),
              objectFit: 'cover',
              marginBottom: '1.5rem',
              flexShrink: 0,
              display: 'block',
              border: `3px solid ${globalStyle.buttonStyle === 'glass' ? 'rgba(255,255,255,0.5)' : 'transparent'}`,
              boxShadow: globalStyle.buttonStyle === 'glass' ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
            }}
          />
        )}
        
        {content.title && (
          <h1
            {...aosAttrs(42)}
            style={{
              ...getProfileFieldStyle(content.titleStyle, 'title', globalStyle),
              marginBottom: '0.25rem',
              width: '100%',
              textAlign: content.titleStyle?.align || 'center'
            }}
          >
            {t(content.title)}
          </h1>
        )}
        {content.subtitle && (
          <h2
            {...aosAttrs(84)}
            style={{
              ...getProfileFieldStyle(content.subtitleStyle, 'subtitle', globalStyle),
              marginBottom: '1rem',
              width: '100%',
              textAlign: content.subtitleStyle?.align || 'center'
            }}
          >
            {t(content.subtitle)}
          </h2>
        )}
        {content.description && (
          <p
            {...aosAttrs(126)}
            style={{
              ...getProfileFieldStyle(content.descriptionStyle, 'description', globalStyle),
              marginBottom: '2rem',
              width: '100%',
              textAlign: content.descriptionStyle?.align || 'center'
            }}
          >
            {t(content.description)}
          </p>
        )}

        {onReorder ? (
          <DragDropContext onDragEnd={(res) => { if(res.destination) onReorder(res.source.index, res.destination.index); }}>
            <Droppable droppableId="preview-sections">
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef} 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Visual Guide / Ruler */}
                  {snapshot.isDraggingOver && (
                    <div style={{
                      position: 'absolute',
                      left: '-20px',
                      right: '-20px',
                      top: 0,
                      bottom: 0,
                      pointerEvents: 'none',
                      borderLeft: '1px dashed rgba(0,0,0,0.1)',
                      borderRight: '1px dashed rgba(0,0,0,0.1)',
                      zIndex: 0
                    }}>
                      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.05)', transform: 'translateX(-50%)' }} />
                    </div>
                  )}

                  {content.sections?.map((section, idx) => (
                    <Draggable key={section.id} draggableId={section.id} index={idx}>
                      {(provided, snap) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          {...aosAttrs(168 + idx * 56)}
                          style={{ 
                            width: '100%', 
                            ...provided.draggableProps.style,
                            opacity: snap.isDragging ? 0.7 : 1,
                            transform: snap.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform,
                            position: 'relative',
                            zIndex: snap.isDragging ? 10 : 1
                          }}
                        >
                          {/* Item Rulers when dragging */}
                          {snap.isDragging && (
                             <>
                                <div style={{ position: 'absolute', top: '-10px', left: '-40px', right: '-40px', height: '1px', background: 'var(--primary-color, #000)', opacity: 0.3 }} />
                                <div style={{ position: 'absolute', bottom: '-10px', left: '-40px', right: '-40px', height: '1px', background: 'var(--primary-color, #000)', opacity: 0.3 }} />
                             </>
                          )}
                          {renderSection(section)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {content.sections?.map((section, idx) => (
              <div key={section.id} style={{ width: '100%' }} {...aosAttrs(168 + idx * 56)}>
                {renderSection(section)}
              </div>
            ))}
          </div>
        )}
        
        {/* Language Switcher for Visitors */}
        {!onReorder && (
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.75rem', opacity: 0.6 }}>
            {['uz', 'ru', 'en'].map(l => (
              <button 
                key={l}
                onClick={() => setActiveLang(l)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  fontWeight: activeLang === l ? 700 : 400,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: activeLang === l ? 'rgba(0,0,0,0.05)' : 'transparent'
                }}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
};
