import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PROFILE_FIELD_DEFAULTS } from '../core/textSectionStyle';

/**
 * Profil matnlari (title / subtitle / description) uchun uslub paneli.
 * Tor sidebar uchun: 2 qator — tepada tekislash + rang, pastda o‘lcham / qalinlik.
 */
export function ProfileTextStyleControls({ style, onPatch, globalTextColor, fieldKey }) {
  const s = style || {};
  const def = PROFILE_FIELD_DEFAULTS[fieldKey] || PROFILE_FIELD_DEFAULTS.description;
  const align = s.align ?? def.align;
  const fontSize = s.fontSize ?? def.fontSize;
  const fontWeight = s.fontWeight ?? def.fontWeight;

  return (
    <div
      className="flex-col"
      style={{
        marginBottom: '0.35rem',
        gap: '0.5rem',
        width: '100%',
        minWidth: 0,
      }}
    >
      <div
        className="flex items-center"
        style={{
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'space-between',
          width: '100%',
          minWidth: 0,
        }}
      >
        <div className="flex gap-1" style={{ flexShrink: 0 }}>
          {[
            { id: 'left', Icon: AlignLeft },
            { id: 'center', Icon: AlignCenter },
            { id: 'right', Icon: AlignRight },
          ].map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              className={`btn ${align === id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.45rem' }}
              onClick={() => onPatch({ align: id })}
              aria-label={id}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2" style={{ flexShrink: 0, marginLeft: 'auto' }}>
          <input
            type="color"
            value={(s.color && String(s.color).trim()) ? s.color : globalTextColor}
            onChange={(e) => onPatch({ color: e.target.value })}
            title="Rang"
            style={{
              width: '34px',
              height: '32px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.7rem', padding: '0.35rem 0.55rem', whiteSpace: 'nowrap' }}
            onClick={() => onPatch({ color: '' })}
          >
            Tema
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '0.5rem',
          width: '100%',
          minWidth: 0,
        }}
      >
        <select
          className="input-field"
          style={{
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            padding: '0.45rem 0.4rem',
            fontSize: '0.8rem',
            boxSizing: 'border-box',
          }}
          value={fontSize}
          onChange={(e) => onPatch({ fontSize: e.target.value })}
          aria-label="Shrift o‘lchami"
        >
          <option value="sm">Kichik</option>
          <option value="base">Oddiy</option>
          <option value="lg">Katta</option>
          <option value="xl">Yirik</option>
          <option value="2xl">Juda yirik</option>
        </select>
        <select
          className="input-field"
          style={{
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            padding: '0.45rem 0.4rem',
            fontSize: '0.8rem',
            boxSizing: 'border-box',
          }}
          value={fontWeight}
          onChange={(e) => onPatch({ fontWeight: e.target.value })}
          aria-label="Shrift qalinligi"
        >
          <option value="normal">Oddiy</option>
          <option value="medium">O‘rtacha</option>
          <option value="semibold">Yarim qalin</option>
          <option value="bold">Qalin</option>
        </select>
      </div>
    </div>
  );
}
