import { sql, initDb } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug: slugRaw, event, targetKey } = req.body || {};
  const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';

  if (!slug || (event !== 'view' && event !== 'click')) {
    return res.status(400).json({ error: 'Noto‘g‘ri so‘rov' });
  }

  try {
    await initDb();

    const rows = await sql`SELECT click_stats, view_count FROM sites WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sayt topilmadi' });
    }

    if (event === 'view') {
      await sql`UPDATE sites SET view_count = view_count + 1 WHERE slug = ${slug}`;
      return res.status(200).json({ ok: true });
    }

    const key = typeof targetKey === 'string' && targetKey.length < 200 ? targetKey : 'unknown';
    const prev = rows[0].click_stats || {};
    const stats = typeof prev === 'string' ? JSON.parse(prev) : { ...prev };
    stats[key] = (Number(stats[key]) || 0) + 1;

    await sql`UPDATE sites SET click_stats = ${JSON.stringify(stats)}::jsonb WHERE slug = ${slug}`;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('site-track error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
