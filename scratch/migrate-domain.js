import 'dotenv/config';
import { sql } from '../lib/server/db.js';

async function check() {
  try {
    const res = await sql`SELECT result_url FROM converts LIMIT 10`;
    console.log('Mavjud URL lar:', res);
  } catch (e) {
    console.error('❌ XATO:', e);
  }
}

check();
