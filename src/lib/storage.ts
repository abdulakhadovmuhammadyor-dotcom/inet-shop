import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Neon Object Storage (S3-compatible, branch-scoped).
 *
 * `neon deploy` injects the standard AWS_* variables, so the SDK can pick up
 * credentials/endpoint/region from the environment. The only non-default
 * setting is `forcePathStyle`, which Neon requires.
 */
export const STORAGE_BUCKET = 'assets';
export const RECEIPTS_PREFIX = 'receipts';

const globalForStorage = globalThis as unknown as { __neonS3?: S3Client };

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ENDPOINT_URL_S3
  );
}

function getS3Client(): S3Client {
  if (!globalForStorage.__neonS3) {
    if (!isStorageConfigured()) {
      throw new Error(
        'Neon Object Storage is not configured. Run `neon deploy` to pull AWS_* variables.'
      );
    }

    globalForStorage.__neonS3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-2',
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      forcePathStyle: true,
    });
  }

  return globalForStorage.__neonS3;
}

export function buildReceiptKey(fileName: string): string {
  const extension = fileName.includes('.')
    ? fileName.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'bin';
  const date = new Date().toISOString().slice(0, 10);
  return `${RECEIPTS_PREFIX}/${date}/${crypto.randomUUID()}.${extension}`;
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'private, max-age=0',
    })
  );
}

/** Returns a presigned GET URL; the `assets` bucket is private. */
export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }),
    { expiresIn }
  );
}
