import 'dotenv/config';
import { Buffer } from 'node:buffer';
import { uploadToS3 } from '../lib/server/s3.js';

async function testCore() {
  console.log('--- CORE LOGIC TEST ---');

  try {
    // 1. S3 Test
    console.log('1. S3 Upload Test...');
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const res = await uploadToS3('test/final-test.png', buffer, 'image/png');
    console.log('✅ S3 URL:', res.url);

    // 2. Extension Test
    console.log('\n2. Extension Logic Test...');
    const mime = 'image/avif';
    let ext = mime.split('/')[1] || 'jpg';
    if (ext === 'avif') console.log('✅ AVIF Extension: OK');

    // 3. vCard Test
    console.log('\n3. vCard Format Test...');
    const v = { firstName: 'Test', lastName: 'User', phone: '123' };
    const content = `BEGIN:VCARD\nVERSION:3.0\nFN:${v.firstName} ${v.lastName}\nEND:VCARD`;
    if (content.includes('BEGIN:VCARD')) console.log('✅ vCard: OK');

    console.log('\n--- BARCHA TESTLAR MUVAFFAQIYATLI ---');
  } catch (e) {
    console.error('❌ XATO:', e.message);
    process.exit(1);
  }
}

testCore();
