import bcrypt from 'bcryptjs';
import { sql, initDb } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug: slugRaw, password } = req.body || {};
  const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';
  if (!slug || typeof password !== 'string') {
    return res.status(400).json({ error: 'Slug va parol kerak' });
  }

  try {
    await initDb();

    const rows = await sql`
      SELECT data, access_password_hash FROM sites WHERE slug = ${slug} LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sayt topilmadi' });
    }

    const hash = rows[0].access_password_hash;
    if (!hash) {
      const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
      return res.status(200).json(data);
    }

    const ok = bcrypt.compareSync(password, hash);
    if (!ok) {
      return res.status(401).json({ error: 'Noto‘g‘ri parol' });
    }

    const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
    return res.status(200).json(data);
  } catch (error) {
    console.error('unlock-site error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
