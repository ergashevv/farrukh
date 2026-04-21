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

  try {
    await initDb();

    const rows = await sql`
      SELECT slug, data, updated_at
      FROM sites
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;

    const sites = rows.map((r) => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      const title = data?.content?.title || r.slug;
      return {
        slug: r.slug,
        title,
        updatedAt: r.updated_at
      };
    });

    return res.status(200).json({ sites });
  } catch (error) {
    console.error('my-sites error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
