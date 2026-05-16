import 'dotenv/config';
import { sql } from '../lib/server/db.js';

async function fix() {
  try {
    console.log('Sites jadvalini tekshirish...');
    await sql.query('ALTER TABLE sites ADD COLUMN IF NOT EXISTS id SERIAL');
    console.log('✅ Sites jadvaliga id qo‘shildi (yoki bor edi)');
    
    console.log('Converts jadvalini tekshirish...');
    await sql.query(`
      CREATE TABLE IF NOT EXISTS converts (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        result_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Converts jadvali tayyor');
    
    console.log('Ustunlarni tekshirish...');
    const res = await sql.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sites'");
    console.log('Sites ustunlari:', res.rows.map(r => r.column_name));
    
  } catch (e) {
    console.error('❌ XATO:', e);
  }
}

fix();
