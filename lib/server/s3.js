import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

export async function deleteFromS3(pathname) {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return;
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: pathname,
  });
  await s3Client.send(command);
}

export async function getPresignedUrl(pathname, contentType) {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error('S3 bucket not configured');
  const region = process.env.AWS_REGION || 'ap-south-1';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: pathname,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${pathname}`;
  
  return { url, uploadUrl };
}
