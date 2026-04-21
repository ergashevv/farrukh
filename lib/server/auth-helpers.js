import crypto from 'node:crypto';

const SECRET = () => process.env.AUTH_SECRET || 'dev-only-change-AUTH_SECRET';

export function signToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 28
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch {
    return null;
  }
}

export function getBearerUserId(req) {
  const h = req.headers?.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  return verifyToken(h.slice(7).trim());
}
