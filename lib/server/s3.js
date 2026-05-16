import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadToS3(pathname, buffer, contentType) {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'ap-south-1';

  const parallelUploads3 = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: pathname,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false,
  });

  await parallelUploads3.done();
  
  return {
    url: `https://${bucket}.s3.${region}.amazonaws.com/${pathname}`
  };
}

export async function deleteFromS3(url) {
  try {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION || 'ap-south-1';
    const prefix = `https://${bucket}.s3.${region}.amazonaws.com/`;
    
    if (!url.startsWith(prefix)) return;
    
    const key = url.replace(prefix, '');
    
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
  }
}
