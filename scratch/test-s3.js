import 'dotenv/config';
import { uploadToS3, deleteFromS3 } from '../lib/server/s3.js';
import { Buffer } from 'node:buffer';

async function test() {
  console.log('--- S3 Test Boshlandi ---');
  console.log('Bucket:', process.env.AWS_S3_BUCKET);
  console.log('Region:', process.env.AWS_REGION);

  try {
    const testContent = Buffer.from('Hello S3 Test ' + new Date().toISOString());
    const pathname = `test/test-${Date.now()}.txt`;
    
    console.log('1. Fayl yuklanmoqda:', pathname);
    const result = await uploadToS3(pathname, testContent, 'text/plain');
    console.log('✅ Yuklandi! URL:', result.url);

    console.log('2. Fayl o\'chirilmoqda...');
    await deleteFromS3(result.url);
    console.log('✅ O\'chirildi!');

    console.log('\n--- TEST MUVAFFAQIYATLI YAKUNLANDI ---');
  } catch (error) {
    console.error('\n❌ XATOLIK YUZ BERDI:');
    console.error(error);
    process.exit(1);
  }
}

test();
