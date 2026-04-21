import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { PROFILE_FIELD_DEFAULTS } from '../core/textSectionStyle';

/**
 * Profil matnlari (title / subtitle / description) uchun ixcham uslub paneli.
 */
export function ProfileTextStyleControls({ style, onPatch, globalTextColor, fieldKey }) {
  const s = style || {};
  const def = PROFILE_FIELD_DEFAULTS[fieldKey] || PROFILE_FIELD_DEFAULTS.description;
  const align = s.align ?? def.align;
  const fontSize = s.fontSize ?? def.fontSize;
  const fontWeight = s.fontWeight ?? def.fontWeight;

  return (
    <div className="flex-col gap-2" style={{ marginBottom: '0.35rem' }}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
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
        <select
          className="input-field"
          style={{ flex: '1 1 90px', minWidth: '80px', padding: '0.45rem', fontSize: '0.8rem' }}
          value={fontSize}
          onChange={(e) => onPatch({ fontSize: e.target.value })}
        >
          <option value="sm">Kichik</option>
          <option value="base">Oddiy</option>
          <option value="lg">Katta</option>
          <option value="xl">Yirik</option>
          <option value="2xl">Juda yirik</option>
        </select>
        <select
          className="input-field"
          style={{ flex: '1 1 90px', minWidth: '80px', padding: '0.45rem', fontSize: '0.8rem' }}
          value={fontWeight}
          onChange={(e) => onPatch({ fontWeight: e.target.value })}
        >
          <option value="normal">Oddiy</option>
          <option value="medium">O‘rtacha</option>
          <option value="semibold">Yarim qalin</option>
          <option value="bold">Qalin</option>
        </select>
        <input
          type="color"
          value={(s.color && String(s.color).trim()) ? s.color : globalTextColor}
          onChange={(e) => onPatch({ color: e.target.value })}
          title="Rang"
          style={{ width: '34px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}
        />
        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.65rem', padding: '0.3rem 0.45rem' }} onClick={() => onPatch({ color: '' })}>
          Tema
        </button>
      </div>
    </div>
  );
}
