import { sql } from './db.js';

/** Bitta PDF fayl */
export const MAX_PDF_FILE_BYTES = 20 * 1024 * 1024;
/** Barcha saytlar bo‘yicha Vercel Blob PDF lar yig‘indisi (10 × max fayl) */
export const MAX_USER_TOTAL_PDF_BYTES = 10 * MAX_PDF_FILE_BYTES;

const VERCEL_BLOB_HOST = 'blob.vercel-storage.com';

export function isPdfDownloadItem(item) {
  if (!item || typeof item.url !== 'string' || !item.url.trim()) return false;
  const ft = (item.fileType || '').toLowerCase();
  if (ft === 'pdf') return true;
  const path = item.url.toLowerCase().split('?')[0];
  return path.endsWith('.pdf');
}

export function pdfItemCountedBytes(item) {
  if (!isPdfDownloadItem(item)) return 0;
  if (!isVercelBlobPdfUrl(item.url)) return 0;
  const n = Number(item.sizeBytes);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), MAX_PDF_FILE_BYTES);
}

export function isVercelBlobPdfUrl(url) {
  if (typeof url !== 'string') return false;
  return url.includes(VERCEL_BLOB_HOST) && url.toLowerCase().split('?')[0].endsWith('.pdf');
}

export function sumPdfBytesInSiteData(data) {
  const sections = data?.content?.sections;
  if (!Array.isArray(sections)) return 0;
  let sum = 0;
  for (const s of sections) {
    if (s?.type !== 'downloads' || !Array.isArray(s.data?.items)) continue;
    for (const item of s.data.items) {
      sum += pdfItemCountedBytes(item);
    }
  }
  return sum;
}

function normalizeRowData(raw) {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

/**
 * Foydalanuvchining barcha saytlaridagi hisobga olinadigan PDF baytlari (sizeBytes bo‘yicha).
 * patchSlug/patchData — hozir saqlanayotgan loyiha JSON ini DB dagi eski nusxa o‘rniga qo‘yadi.
 */
export async function getTotalPdfBytesForUser(userId, patchSlug = null, patchData = null) {
  const rows = await sql`SELECT slug, data FROM sites WHERE user_id = ${userId}`;
  let total = 0;
  for (const row of rows) {
    let data;
    if (patchSlug && row.slug === patchSlug && patchData && typeof patchData === 'object') {
      data = patchData;
    } else {
      data = normalizeRowData(row.data);
    }
    total += sumPdfBytesInSiteData(data);
  }
  return total;
}

/**
 * Almashtirish: DB da shu URL birinchi marta uchragan PDF elementining sizeBytes (bitta slot).
 */
export async function firstMatchingPdfSizeBytesForUrl(userId, replaceUrl) {
  if (!replaceUrl || typeof replaceUrl !== 'string') return 0;
  const rows = await sql`SELECT data FROM sites WHERE user_id = ${userId} ORDER BY slug`;
  for (const row of rows) {
    const data = normalizeRowData(row.data);
    for (const s of data?.content?.sections || []) {
      if (s?.type !== 'downloads' || !Array.isArray(s.data?.items)) continue;
      for (const item of s.data.items) {
        if (item?.url === replaceUrl && isPdfDownloadItem(item)) {
          const n = Number(item.sizeBytes);
          if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), MAX_PDF_FILE_BYTES);
        }
      }
    }
  }
  return 0;
}

/**
 * Vercel Blob dan kelgan PDF lar saqlanganda sizeBytes majburiy.
 */
export function validateBlobPdfItemsHaveSize(data) {
  const sections = data?.content?.sections;
  if (!Array.isArray(sections)) return null;
  for (const s of sections) {
    if (s?.type !== 'downloads' || !Array.isArray(s.data?.items)) continue;
    for (const item of s.data.items) {
      if (!isPdfDownloadItem(item)) continue;
      if (!isVercelBlobPdfUrl(item.url)) continue;
      const n = Number(item.sizeBytes);
      if (!Number.isFinite(n) || n <= 0 || n > MAX_PDF_FILE_BYTES) {
        return {
          error:
            'Vercel Blob PDF lar uchun hajm (sizeBytes) kerak. Iltimos, faylni qayta yuklang yoki havolani o‘chiring.',
        };
      }
    }
  }
  return null;
}
