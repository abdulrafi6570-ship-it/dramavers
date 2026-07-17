import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { logger } from "./logger";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);
}

export function assertR2Configured(): void {
  const missing: string[] = [];
  if (!R2_ACCOUNT_ID) missing.push("CLOUDFLARE_R2_ACCOUNT_ID");
  if (!R2_ACCESS_KEY_ID) missing.push("CLOUDFLARE_R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  if (!R2_BUCKET_NAME) missing.push("CLOUDFLARE_R2_BUCKET_NAME");
  if (!R2_PUBLIC_URL) missing.push("CLOUDFLARE_R2_PUBLIC_URL");
  if (missing.length > 0) {
    throw new Error(`[R2] Missing env vars: ${missing.join(", ")}`);
  }
}

function getR2Client(): S3Client {
  assertR2Configured();
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function checkR2Bucket(): Promise<void> {
  const client = getR2Client();
  logger.info({ bucket: R2_BUCKET_NAME, endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` }, "[R2] Checking bucket access");
  await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME! }));
  logger.info({ bucket: R2_BUCKET_NAME }, "[R2] Bucket accessible");
}

export type R2Folder = "images" | "videos" | "audio" | "misc";

export function buildR2Key(folder: R2Folder, filename: string): string {
  return `${folder}/${filename}`;
}

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  assertR2Configured();
  const client = getR2Client();

  logger.info({ bucket: R2_BUCKET_NAME, key, contentType, sizeBytes: buffer.length }, "[R2] Uploading object");

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  const base = R2_PUBLIC_URL!.replace(/\/$/, "");
  const url = `${(process.env.BACKEND_URL || "").replace(/\/$/, "")}/r2proxy/${key}`;

  logger.info({ bucket: R2_BUCKET_NAME, key, url }, "[R2] Upload success");
  return url;
}

export async function deleteFromR2(key: string): Promise<void> {
  assertR2Configured();
  const client = getR2Client();
  logger.info({ bucket: R2_BUCKET_NAME, key }, "[R2] Deleting object");
  await client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: key,
  }));
  logger.info({ bucket: R2_BUCKET_NAME, key }, "[R2] Delete success");
}
