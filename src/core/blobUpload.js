/**
 * Upload a data URL to Vercel Blob via /api/upload-blob (production / vercel dev).
 * Returns null when API is unavailable (e.g. plain vite dev) — caller should fall back to data URL.
 */
export async function uploadImageToBlob(dataUrl, kind = 'avatar') {
  try {
    const r = await fetch('/api/upload-blob', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, kind }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.url || null;
  } catch {
    return null;
  }
}
