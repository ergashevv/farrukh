import { getRouteHandler } from '../lib/server/handlers.js';

/**
 * Bitta Serverless Function — Vercel Hobby (max 12 function) limiti uchun.
 * /api/get-site va boshqalar vercel.json rewrite orqali ?__p=... bilan shu yerga keladi.
 */
export default async function handler(req, res) {
  const raw = req.query?.__p;
  const segment = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  const routeKey = (segment || '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')[0]
    .trim();

  if (!routeKey) {
    return res.status(404).json({ error: 'Not found' });
  }

  const fn = getRouteHandler(routeKey);
  if (!fn) {
    return res.status(404).json({ error: 'Not found' });
  }

  return fn(req, res);
}
