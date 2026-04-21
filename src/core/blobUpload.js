import { upload } from '@vercel/blob/client';

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MULTIPART_THRESHOLD = Math.ceil(4.5 * 1024 * 1024);

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

/**
 * PDF ni brauzerdan to‘g‘ridan-to‘g‘ri Blob ga yuklaydi (Vercel / vercel dev).
 * @param {string} [options.replaceUrl] — DB dagi eski Blob PDF URL (kvota: bitta slot almashtirish).
 * @param {(ev: { loaded: number; total: number; percentage: number }) => void} [options.onUploadProgress]
 * @returns {{ ok: true, url: string, sizeBytes: number } | { ok: false, error: string }}
 */
export async function uploadPdfToBlob(file, bearerToken, options = {}) {
  if (!file) {
    return { ok: false, error: 'Fayl tanlanmagan' };
  }
  const mime = (file.type || '').toLowerCase();
  if (mime !== 'application/pdf') {
    return { ok: false, error: 'Faqat PDF fayl' };
  }
  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, error: `PDF hajmi ${MAX_PDF_BYTES / (1024 * 1024)} MB dan oshmasin` };
  }
  if (!bearerToken || typeof bearerToken !== 'string') {
    return { ok: false, error: 'Avval hisobga kiring' };
  }

  const replaceUrl =
    typeof options.replaceUrl === 'string' && options.replaceUrl.includes('blob.vercel-storage.com')
      ? options.replaceUrl.trim()
      : '';

  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const pathname = `pdfs/${id}.pdf`;

  const clientPayload = JSON.stringify({
    sizeBytes: file.size,
    replaceUrl: replaceUrl || null,
  });

  const onProgress =
    typeof options.onUploadProgress === 'function' ? options.onUploadProgress : undefined;

  try {
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload-pdf',
      headers: { Authorization: `Bearer ${bearerToken.trim()}` },
      clientPayload,
      multipart: file.size > MULTIPART_THRESHOLD,
      contentType: 'application/pdf',
      ...(onProgress ? { onUploadProgress: onProgress } : {}),
    });
    return { ok: true, url: blob.url, sizeBytes: file.size };
  } catch (e) {
    const msg = e?.message || 'Yuklash muvaffaqiyatsiz';
    return { ok: false, error: msg };
  }
}
