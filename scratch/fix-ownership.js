import 'dotenv/config';
import { sql } from '../lib/server/db.js';

async function fix() {
  try {
    const user = await sql`SELECT id FROM users WHERE username = 'artstar'`;
    const targetId = user[0].id;
    
    // RETURNING orqali natijani tekshirish
    const sites = await sql`UPDATE sites SET user_id = ${targetId} RETURNING id`;
    console.log(`✅ Saytlar yangilandi: ${sites.length} ta`);
    
    const converts = await sql`UPDATE converts SET user_id = ${targetId} RETURNING id`;
    console.log(`✅ QR tarix yangilandi: ${converts.length} ta`);

    const all = await sql`SELECT slug, user_id FROM sites`;
    console.log('Hozirgi holat (sites):', all);

  } catch (e) {
    console.error('❌ XATO:', e);
  }
}

fix();
