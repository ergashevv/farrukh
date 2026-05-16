import 'dotenv/config';
import { getPresignedUrl } from '../lib/server/s3.js';

async function testS3() {
  console.log('S3 Presigned URL testini boshlaymiz...');
  try {
    const key = 'test/integrity-check.pdf';
    const mime = 'application/pdf';
    const result = await getPresignedUrl(key, mime);
    
    console.log('✅ URL hosil qilindi:');
    console.log('   Public URL:', result.url);
    console.log('   Upload URL:', result.uploadUrl.substring(0, 100) + '...');
    
    if (result.url.includes('amazonaws.com')) {
      console.log('✅ AWS S3 domeni to‘g‘ri');
    } else {
      console.log('❌ AWS domeni xato!');
    }
  } catch (e) {
    console.error('❌ S3 XATOSI:', e.message);
  }
}

testS3();
