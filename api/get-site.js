import { sql, initDb } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    await initDb();

    const results = await sql`
      SELECT data FROM sites WHERE slug = ${slug} LIMIT 1;
    `;

    if (results.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }

    return res.status(200).json(results[0].data);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
