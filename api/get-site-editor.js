import { sql, initDb } from './db.js';
import { getBearerUserId } from './auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getBearerUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Kirish kerak' });
  }

  const slugRaw = req.query?.slug;
  const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';
  if (!slug) {
    return res.status(400).json({ error: 'Slug kerak' });
  }

  try {
    await initDb();
    const rows = await sql`
      SELECT data, user_id FROM sites WHERE slug = ${slug} LIMIT 1
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sayt topilmadi' });
    }
    if (rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Bu saytni tahrirlash huquqi yo‘q' });
    }
    const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
    return res.status(200).json(data);
  } catch (error) {
    console.error('get-site-editor error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
