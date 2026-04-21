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
      const gs = data?.globalStyle || {};
      const content = data?.content || {};
      let avatarUrl = content.avatar || null;
      if (avatarUrl && typeof avatarUrl === 'string') {
        const isHttp = /^https?:\/\//i.test(avatarUrl);
        const isSmallData = avatarUrl.startsWith('data:') && avatarUrl.length < 14000;
        if (!isHttp && !isSmallData) avatarUrl = null;
      } else {
        avatarUrl = null;
      }

      return {
        slug: r.slug,
        title,
        updatedAt: r.updated_at,
        preview: {
          backgroundColor: gs.backgroundColor || '#ffffff',
          backgroundGradient: gs.backgroundGradient || null,
          textColor: gs.textColor || '#18181b',
          primaryColor: gs.primaryColor || '#000000',
          avatarUrl,
          avatarShape: content.avatarShape || 'circle',
        },
      };
    });

    return res.status(200).json({ sites });
  } catch (error) {
    console.error('my-sites error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
