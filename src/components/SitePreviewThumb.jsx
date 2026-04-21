import React from 'react';

/**
 * Dashboard uchun saytning ranglari va avatar asosida kichik ko‘rinish.
 */
export function SitePreviewThumb({ preview, title }) {
  const gs = preview || {};
  const bgStyle = gs.backgroundGradient
    ? { background: gs.backgroundGradient }
    : { backgroundColor: gs.backgroundColor || '#f4f4f5' };

  const textColor = gs.textColor || '#18181b';
  const primary = gs.primaryColor || '#000000';
  const shape = gs.avatarShape === 'square' ? '10px' : '50%';
  const initial = (title || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className="site-preview-thumb"
      style={{
        width: 132,
        height: 84,
        flexShrink: 0,
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)',
        ...bgStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '8px 6px',
        boxSizing: 'border-box',
      }}
    >
      {gs.avatarUrl ? (
        <img
          src={gs.avatarUrl}
          alt=""
          style={{
            width: 32,
            height: 32,
            borderRadius: shape,
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: shape,
            backgroundColor: primary,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
            fontFamily: 'var(--font-display, Outfit), system-ui, sans-serif',
          }}
        >
          {initial}
        </div>
      )}
      <div
        style={{
          fontSize: '9px',
          fontWeight: 600,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {title || '—'}
      </div>
    </div>
  );
}
