/** @param {string} raw */
export function extractYoutubeVideoId(raw) {
  const s = (raw || '').trim();
  if (!s) return null;
  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }
    if (host.includes('youtube.com') || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v) return v;
      let m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
      m = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (m) return m[1];
      m = u.pathname.match(/\/live\/([^/?]+)/);
      if (m) return m[1];
    }
  } catch {
    /* ignore */
  }
  return null;
}
