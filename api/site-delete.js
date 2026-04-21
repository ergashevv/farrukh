import { sql, initDb } from './db.js';
import { getBearerUserId } from './auth-helpers.js';

const RESERVED = new Set([
  'login', 'dashboard', 'builder', 'preview', 'api', 'assets', 'static', 'favicon.ico'
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getBearerUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Kirish kerak' });
  }

  try {
    const slugRaw = req.body?.slug;
    const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';
    if (!slug || RESERVED.has(slug.toLowerCase())) {
      return res.status(400).json({ error: 'Noto‘g‘ri slug' });
    }

    await initDb();

    const result = await sql`
      DELETE FROM sites WHERE slug = ${slug} AND user_id = ${userId}
      RETURNING slug
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Topilmadi yoki sizniki emas' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('site-delete error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
