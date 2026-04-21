import { sql, initDb } from './db.js';
import { getBearerUserId } from './auth-helpers.js';

const RESERVED = new Set([
  'login', 'dashboard', 'builder', 'preview', 'api', 'assets', 'static', 'favicon.ico'
]);

const MAX_SITES = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getBearerUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Kirish kerak' });
  }

  try {
    const { slug: slugRaw, data } = req.body || {};
    const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';
    if (!slug || slug.length > 32) {
      return res.status(400).json({ error: 'Slug kerak (max 32 belgi)' });
    }
    if (!/^[A-Z0-9]+$/.test(slug)) {
      return res.status(400).json({ error: 'Slug faqat A–Z va raqamlar' });
    }
    if (RESERVED.has(slug.toLowerCase())) {
      return res.status(400).json({ error: 'Bu slug band' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Ma’lumot yo‘q' });
    }

    await initDb();

    const existing = await sql`
      SELECT slug, user_id FROM sites WHERE slug = ${slug} LIMIT 1
    `;

    if (existing.length > 0) {
      if (existing[0].user_id !== userId) {
        return res.status(403).json({ error: 'Bu slug boshqa foydalanuvchiga tegishli' });
      }
      await sql`
        UPDATE sites
        SET data = ${data}, updated_at = CURRENT_TIMESTAMP
        WHERE slug = ${slug}
      `;
      return res.status(200).json({ ok: true, slug, updated: true });
    }

    const rows = await sql`
      SELECT COUNT(*)::int AS count FROM sites WHERE user_id = ${userId}
    `;
    const count = Number(rows[0]?.count ?? 0);
    if (count >= MAX_SITES) {
      return res.status(400).json({
        error: 'Limit: 5 ta sayt. Yangisini qo‘shish uchun birini o‘chiring.',
        code: 'LIMIT'
      });
    }

    await sql`
      INSERT INTO sites (slug, data, user_id, updated_at)
      VALUES (${slug}, ${data}, ${userId}, CURRENT_TIMESTAMP)
    `;

    return res.status(201).json({ ok: true, slug, created: true });
  } catch (error) {
    if (error.code === '23505' || String(error.message || '').includes('unique')) {
      return res.status(409).json({ error: 'Bu slug allaqachon band' });
    }
    console.error('site-save error:', error);
    return res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
}
