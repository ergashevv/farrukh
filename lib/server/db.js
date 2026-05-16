import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

export const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sites (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Ustunlarni xavfsiz qo'shish va tiplarni to'g'rilash
  await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS user_id UUID`;
  await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS access_password_hash TEXT`;
  await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 NOT NULL`;
  await sql`ALTER TABLE sites ADD COLUMN IF NOT EXISTS click_stats JSONB DEFAULT '{}'::jsonb`;

  await sql`
    CREATE TABLE IF NOT EXISTS converts (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      result_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
}
