import { sql, initDb } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, data } = req.body;

    if (!slug || !data) {
      return res.status(400).json({ error: 'Slug and data are required' });
    }

    await initDb();

    await sql`
      INSERT INTO sites (slug, data, updated_at)
      VALUES (${slug}, ${data}, CURRENT_TIMESTAMP)
      ON CONFLICT (slug) DO UPDATE
      SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;
    `;

    return res.status(200).json({ success: true, message: 'Site published successfully' });
  } catch (error) {
    console.error('Publish error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
