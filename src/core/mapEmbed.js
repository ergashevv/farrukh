/**
 * Extract iframe src from pasted embed HTML or return trimmed URL string.
 */
export function extractMapEmbedSrc(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (trimmed.includes('<iframe')) {
    const m = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    return m ? m[1].trim() : '';
  }
  return trimmed;
}

/**
 * Only https embeds from Google Maps or Yandex Maps widgets.
 */
export function isAllowedMapEmbedUrl(urlString) {
  if (!urlString) return false;
  try {
    const u = new URL(urlString);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (h === 'www.google.com' || h === 'maps.google.com' || h.endsWith('.google.com')) {
      return u.pathname.includes('/maps/embed') || u.pathname.includes('maps/embed');
    }
    if (h.includes('yandex.')) {
      const p = u.pathname.toLowerCase();
      return p.includes('map-widget') || p.includes('/maps/') || p.startsWith('/maps');
    }
    return false;
  } catch {
    return false;
  }
}
