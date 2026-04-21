/** Matn bloki (section type: text) uchun uslublar — Renderer va Builder bilan umumiy */

export const TEXT_SIZE_MAP = {
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
};

export const TEXT_WEIGHT_MAP = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export function getTextSectionRenderStyle(sectionData, globalStyle) {
  const d = sectionData || {};
  return {
    textAlign: d.align || 'center',
    fontSize: TEXT_SIZE_MAP[d.fontSize] || TEXT_SIZE_MAP.base,
    fontWeight: TEXT_WEIGHT_MAP[d.fontWeight] ?? 400,
    color: (d.color && String(d.color).trim()) || globalStyle.textColor,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.65,
    opacity: 0.95,
  };
}

/** Profil: ism, subtitle, tavsif — standartlar (oldingi ko‘rinishga yaqin) */
export const PROFILE_FIELD_DEFAULTS = {
  title: { align: 'center', fontSize: '2xl', fontWeight: 'bold' },
  subtitle: { align: 'center', fontSize: 'base', fontWeight: 'medium' },
  description: { align: 'center', fontSize: 'sm', fontWeight: 'normal' },
};

export function getProfileFieldStyle(fieldStyle, fieldKey, globalStyle) {
  const base = PROFILE_FIELD_DEFAULTS[fieldKey] || PROFILE_FIELD_DEFAULTS.description;
  const fs = fieldStyle || {};
  return getTextSectionRenderStyle(
    {
      align: fs.align ?? base.align,
      fontSize: fs.fontSize ?? base.fontSize,
      fontWeight: fs.fontWeight ?? base.fontWeight,
      color: fs.color,
    },
    globalStyle
  );
}
