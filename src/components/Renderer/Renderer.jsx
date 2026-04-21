import React from 'react';
import { Link as LinkIcon, Mail, Phone, ExternalLink, MapPin } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { isAllowedMapEmbedUrl } from '../../core/mapEmbed';

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

const getIcon = (platform, props) => {
  switch (platform?.toLowerCase()) {
    case 'twitter': return <TwitterIcon {...props} />;
    case 'instagram': return <InstagramIcon {...props} />;
    case 'github': return <GithubIcon {...props} />;
    case 'telegram': return <TelegramIcon {...props} />;
    case 'mail': return <Mail {...props} />;
    case 'phone': return <Phone {...props} />;
    default: return <LinkIcon {...props} />;
  }
};

export const Renderer = ({ data, onReorder }) => {
  const { globalStyle, content } = data;

  const isPattern = globalStyle.backgroundImage?.includes('data:image/svg');
  const bgStyle = globalStyle.backgroundImage
    ? {
        backgroundColor: globalStyle.backgroundColor,
        backgroundImage: globalStyle.backgroundImage,
        backgroundSize: isPattern ? 'auto' : 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: isPattern ? 'repeat' : 'no-repeat'
      }
    : globalStyle.backgroundGradient
      ? { background: globalStyle.backgroundGradient }
      : { backgroundColor: globalStyle.backgroundColor };

  const containerStyle = {
    ...bgStyle,
    minHeight: '100%',
    width: '100%',
    fontFamily: globalStyle.fontFamily === 'Outfit' ? '"Outfit", sans-serif' : '"Inter", sans-serif',
    color: globalStyle.textColor,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 1.5rem',
    boxSizing: 'border-box',
    overflowY: 'auto'
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
                key={link.id} href={link.url} target="_blank" rel="noreferrer" style={getBtnStyle()}
                onMouseOver={(e) => {
                  if(globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = globalStyle.primaryColor; e.currentTarget.style.color = '#fff'; }
                  else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '0.9'; }
                  else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }
                }}
                onMouseOut={(e) => {
                  if(globalStyle.buttonStyle === 'outline') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = globalStyle.textColor; }
                  else if (globalStyle.buttonStyle === 'filled') { e.currentTarget.style.opacity = '1'; }
                  else if (globalStyle.buttonStyle === 'glass') { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; }
                }}
              >
                {link.title}
              </a>
            ))}
          </div>
        );
      case 'contact':
        return (
          <div key={section.id} style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
             {section.data.email && (
               <a href={`mailto:${section.data.email}`} style={{...getBtnStyle(), flex: 1, margin: 0 }}>
                 <Mail size={18} style={{ marginRight: '0.5rem' }} /> Email
               </a>
             )}
             {section.data.phone && (
               <a href={`tel:${section.data.phone}`} style={{...getBtnStyle(), flex: 1, margin: 0 }}>
                 <Phone size={18} style={{ marginRight: '0.5rem' }} /> Call
               </a>
             )}
          </div>
        );
      case 'text':
        return (
           <div key={section.id} style={{ width: '100%', marginBottom: '1.5rem', textAlign: 'center', lineHeight: 1.6, opacity: 0.9 }}>
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
                <span>{section.data.title}</span>
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
      default: return null;
    }
  };

  return (
    <div style={containerStyle} className="site-renderer-container">
      <div style={maxW}>
        {content.avatar && (
          <img 
            src={content.avatar} alt={content.title || 'Avatar'}
            loading="eager"
            decoding="async"
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
        
        {content.title && <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', textAlign: 'center' }}>{content.title}</h1>}
        {content.subtitle && <h2 style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.9, marginBottom: '1rem', textAlign: 'center' }}>{content.subtitle}</h2>}
        {content.description && <p style={{ fontSize: '0.875rem', opacity: 0.8, textAlign: 'center', marginBottom: '2rem', lineHeight: 1.5 }}>{content.description}</p>}

        {onReorder ? (
          <DragDropContext onDragEnd={(res) => { if(res.destination) onReorder(res.source.index, res.destination.index); }}>
            <Droppable droppableId="preview-sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {content.sections?.map((section, idx) => (
                    <Draggable key={section.id} draggableId={section.id} index={idx}>
                      {(provided, snap) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{ 
                            width: '100%', 
                            ...provided.draggableProps.style,
                            opacity: snap.isDragging ? 0.7 : 1,
                            transform: snap.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform,
                          }}
                        >
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
            {content.sections?.map(renderSection)}
          </div>
        )}
        
      </div>
    </div>
  );
};
