import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { sql, initDb } from './db.js';
import { signToken } from './auth-helpers.js';

const USER_RE = /^[a-zA-Z0-9_]{3,32}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};
    const u = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const p = typeof password === 'string' ? password : '';

    if (!USER_RE.test(u)) {
      return res.status(400).json({ error: 'Login 3–32 ta harf, raqam yoki _ bo‘lishi kerak' });
    }
    if (p.length < 4) {
      return res.status(400).json({ error: 'Parol kamida 4 belgi' });
    }

    await initDb();

    const id = randomUUID();
    const passwordHash = bcrypt.hashSync(p, 10);

    await sql`
      INSERT INTO users (id, username, password_hash)
      VALUES (${id}, ${u}, ${passwordHash})
    `;

    const token = signToken(id);
    return res.status(201).json({ token, user: { id, username: u } });
  } catch (error) {
    if (error?.code === '23505' || String(error?.message || '').toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'Bu login band' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}
