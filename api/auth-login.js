import bcrypt from 'bcryptjs';
import { sql, initDb } from './db.js';
import { signToken } from './auth-helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};
    const u = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const p = typeof password === 'string' ? password : '';

    if (!u || !p) {
      return res.status(400).json({ error: 'Login va parol kiriting' });
    }

    await initDb();

    const rows = await sql`
      SELECT id, username, password_hash FROM users WHERE username = ${u} LIMIT 1
    `;

    if (rows.length === 0 || !bcrypt.compareSync(p, rows[0].password_hash)) {
      return res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
    }

    const { id, username: uname } = rows[0];
    const token = signToken(id);
    return res.status(200).json({ token, user: { id, username: uname } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
