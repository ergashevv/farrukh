import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { sql, initDb } from './db.js';
import { getBearerUserId, signToken } from './auth-helpers.js';

const RESERVED = new Set([
  'login', 'dashboard', 'builder', 'preview', 'api', 'assets', 'static', 'favicon.ico'
]);

const MAX_SITES = 5;
const USER_RE = /^[a-zA-Z0-9_]{3,32}$/;

const ALLOWED_BLOB = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!ALLOWED_BLOB.has(mime)) return null;
  return { mime, buffer: Buffer.from(m[2], 'base64') };
}

export async function handleGetSite(req, res) {
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

export async function handleSiteSave(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getBearerUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Kirish kerak' });
  }

  try {
    const { slug: slugRaw, data } = req.body || {};
    const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';
    if (!slug || slug.length > 32) {
      return res.status(400).json({ error: 'Slug kerak (max 32 belgi)' });
    }
    if (!/^[A-Z0-9]+$/.test(slug)) {
      return res.status(400).json({ error: 'Slug faqat A–Z va raqamlar' });
    }
    if (RESERVED.has(slug.toLowerCase())) {
      return res.status(400).json({ error: 'Bu slug band' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Ma’lumot yo‘q' });
    }

    const stored = JSON.parse(JSON.stringify(data));
    const passwordPlain = typeof stored.privacy?.password === 'string' ? stored.privacy.password : '';
    if (!stored.privacy) stored.privacy = {};
    delete stored.privacy.password;
    stored.privacy = {
      enabled: !!data.privacy?.enabled,
      expiresAt: data.privacy?.expiresAt || null,
    };

    let hashAction = 'none';
    let hashVal = null;

    if (!stored.privacy.enabled) {
      hashAction = 'clear';
    } else if (passwordPlain.length > 0) {
      hashAction = 'set';
      hashVal = bcrypt.hashSync(passwordPlain, 10);
    }

    await initDb();

    const existing = await sql`
      SELECT slug, user_id FROM sites WHERE slug = ${slug} LIMIT 1
    `;

    if (stored.privacy.enabled && hashAction !== 'set') {
      const hrows =
        existing.length > 0
          ? await sql`SELECT access_password_hash FROM sites WHERE slug = ${slug} LIMIT 1`
          : [];
      if (!hrows[0]?.access_password_hash) {
        return res.status(400).json({ error: 'Maxfiy sahifa uchun parol kiriting' });
      }
      hashAction = 'none';
    }

    if (existing.length > 0) {
      if (existing[0].user_id !== userId) {
        return res.status(403).json({ error: 'Bu slug boshqa foydalanuvchiga tegishli' });
      }
      await sql`
        UPDATE sites
        SET data = ${stored}, updated_at = CURRENT_TIMESTAMP
        WHERE slug = ${slug}
      `;
      if (hashAction === 'clear') {
        await sql`UPDATE sites SET access_password_hash = NULL WHERE slug = ${slug}`;
      } else if (hashAction === 'set') {
        await sql`UPDATE sites SET access_password_hash = ${hashVal} WHERE slug = ${slug}`;
      }
      return res.status(200).json({ ok: true, slug, updated: true });
    }

    const rows = await sql`
      SELECT COUNT(*)::int AS count FROM sites WHERE user_id = ${userId}
    `;
    const count = Number(rows[0]?.count ?? 0);
    if (count >= MAX_SITES) {
      return res.status(400).json({
        error: 'Limit: 5 ta sayt. Yangisini qo‘shish uchun birini o‘chiring.',
        code: 'LIMIT'
      });
    }

    const initialHash = hashAction === 'set' ? hashVal : null;
    await sql`
      INSERT INTO sites (slug, data, user_id, updated_at, view_count, click_stats, access_password_hash)
      VALUES (
        ${slug},
        ${stored},
        ${userId},
        CURRENT_TIMESTAMP,
        0,
        ${JSON.stringify({})}::jsonb,
        ${initialHash}
      )
    `;

    return res.status(201).json({ ok: true, slug, created: true });
  } catch (error) {
    if (error.code === '23505' || String(error.message || '').includes('unique')) {
      return res.status(409).json({ error: 'Bu slug allaqachon band' });
    }
    console.error('site-save error:', error);
    return res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
}

export async function handleAuthLogin(req, res) {
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

export async function handleAuthRegister(req, res) {
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

export async function handleMySites(req, res) {
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
      SELECT slug, data, updated_at, view_count
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
        viewCount: Number(r.view_count ?? 0),
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

export async function handleSiteDelete(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getBearerUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Kirish kerak' });
  }

  try {
    const slugRaw = req.body?.slug;
    const slug = typeof slugRaw === 'string' ? slugRaw.trim().toUpperCase() : '';
    if (!slug || RESERVED.has(slug.toLowerCase())) {
      return res.status(400).json({ error: 'Noto‘g‘ri slug' });
    }

    await initDb();

    const result = await sql`
      DELETE FROM sites WHERE slug = ${slug} AND user_id = ${userId}
      RETURNING slug
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Topilmadi yoki sizniki emas' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('site-delete error:', error);
    return res.status(500).json({ error: 'Server xatosi' });
  }
}

export async function handleUnlockSite(req, res) {
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

export async function handleSiteTrack(req, res) {
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

export async function handleGetSiteEditor(req, res) {
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

export async function handlePublish(req, res) {
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

export async function handleUploadBlob(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Blob storage not configured' });
  }

  try {
    const { dataUrl, kind } = req.body || {};
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid or disallowed image data' });
    }

    const maxBytes = kind === 'background' ? 6 * 1024 * 1024 : 2 * 1024 * 1024;
    if (parsed.buffer.length > maxBytes) {
      return res.status(400).json({ error: 'File too large' });
    }

    const ext =
      parsed.mime === 'image/png' ? 'png' :
      parsed.mime === 'image/webp' ? 'webp' :
      parsed.mime === 'image/gif' ? 'gif' : 'jpg';

    const folder = kind === 'background' ? 'backgrounds' : 'avatars';
    const pathname = `${folder}/${randomUUID()}.${ext}`;

    const blob = await put(pathname, parsed.buffer, {
      access: 'public',
      contentType: parsed.mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Blob upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
}

const ROUTES = {
  'get-site': handleGetSite,
  'site-save': handleSiteSave,
  'auth-login': handleAuthLogin,
  'auth-register': handleAuthRegister,
  'my-sites': handleMySites,
  'site-delete': handleSiteDelete,
  'unlock-site': handleUnlockSite,
  'site-track': handleSiteTrack,
  'get-site-editor': handleGetSiteEditor,
  publish: handlePublish,
  'upload-blob': handleUploadBlob,
};

export function getRouteHandler(routeKey) {
  if (!routeKey || typeof routeKey !== 'string') return null;
  const k = routeKey.trim().replace(/\.js$/i, '');
  return ROUTES[k] || null;
}
