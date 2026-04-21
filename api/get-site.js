import { sql, initDb } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slugRaw = req.query?.slug;
  const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    await initDb();

    const results = await sql`
      SELECT data, access_password_hash FROM sites WHERE slug = ${slug} LIMIT 1;
    `;

    if (results.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const row = results[0];
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;

    const exp = data?.privacy?.expiresAt;
    if (exp) {
      const t = new Date(exp).getTime();
      if (!Number.isNaN(t) && t < Date.now()) {
        return res.status(410).json({ error: 'expired', message: 'Bu havola muddati tugagan' });
      }
    }

    if (row.access_password_hash) {
      return res.status(200).json({
        locked: true,
        slug,
        teaser: {
          title: data?.content?.title || '',
          subtitle: data?.content?.subtitle || '',
          avatar: data?.content?.avatar || '',
        },
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
