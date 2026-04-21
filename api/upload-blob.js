import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!ALLOWED.has(mime)) return null;
  return { mime, buffer: Buffer.from(m[2], 'base64') };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Blob storage not configured' });
  }

  try {
    const { dataUrl, kind } = req.body || {};
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid or disallowed image data' });
    }

    const maxBytes = kind === 'background' ? 6 * 1024 * 1024 : 2 * 1024 * 1024;
    if (parsed.buffer.length > maxBytes) {
      return res.status(400).json({ error: 'File too large' });
    }

    const ext =
      parsed.mime === 'image/png' ? 'png' :
      parsed.mime === 'image/webp' ? 'webp' :
      parsed.mime === 'image/gif' ? 'gif' : 'jpg';

    const folder = kind === 'background' ? 'backgrounds' : 'avatars';
    const pathname = `${folder}/${randomUUID()}.${ext}`;

    const blob = await put(pathname, parsed.buffer, {
      access: 'public',
      contentType: parsed.mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Blob upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}
