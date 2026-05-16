import 'dotenv/config';
import { sql, initDb } from '../lib/server/db.js';

async function testConnection() {
  console.log('1. DB ulanishini tekshirish...');
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Ulanish muvaffaqiyatli:', result[0].now);

    console.log('\n2. initDb() ni ishga tushirish...');
    await initDb();
    console.log('✅ initDb() muvaffaqiyatli yakunlandi');

    console.log('\n3. Users jadvalini tekshirish...');
    const users = await sql`SELECT count(*) FROM users`;
    console.log('✅ Foydalanuvchilar soni:', users[0].count);

    console.log('\n--- BARCHA DB TESTLARI O‘TDI ---');
  } catch (e) {
    console.error('\n❌ DB XATOSI:', e.message);
    console.error('To‘liq xato:', e);
  }
}

testConnection();
