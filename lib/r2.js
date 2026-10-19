import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
    // SDK terbaru menambah checksum otomatis yang bikin upload langsung dari
    // browser ke R2 ditolak. "WHEN_REQUIRED" mematikannya.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

// Alamat publik bucket, tanpa tanda "/" di ujungnya
export function r2PublicBase() {
  return (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/+$/, '');
}

// Upload sebuah File (dari FormData) ke R2 lewat server, kembalikan public URL-nya.
// Dipakai untuk file kecil (poster, foto aktor, avatar).
export async function uploadToR2(file, folder = 'misc') {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const key = `${folder}/${randomUUID()}.${ext}`;

  const client = r2Client();
  await client.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
  }));

  return `${r2PublicBase()}/${key}`;
}

// Buat alamat upload sementara. Browser mengirim file LANGSUNG ke R2
// (tidak lewat server), jadi tidak kena batas ukuran request hosting.
export async function presignUpload({ folder = 'misc', ext = 'bin', contentType, expiresIn = 3600 }) {
  const key = `${folder}/${randomUUID()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );

  return { uploadUrl, key, publicUrl: `${r2PublicBase()}/${key}` };
}

// Ambil key objek dari public URL milik bucket kita. Null kalau bukan URL bucket ini.
export function keyFromPublicUrl(url) {
  const base = r2PublicBase();
  const s = String(url || '');
  if (!base || !s.startsWith(`${base}/`)) return null;
  return decodeURIComponent(s.slice(base.length + 1));
}

// True kalau URL berasal dari bucket kita dan ada di salah satu folder yang diizinkan
export function isOwnR2Url(url, folders) {
  const key = keyFromPublicUrl(url);
  return !!key && folders.some((f) => key.startsWith(`${f}/`));
}

// Alamat download sementara langsung dari R2 (dipaksa jadi unduhan, tidak lewat server)
export async function presignDownload({ key, filename, expiresIn = 600 }) {
  return getSignedUrl(
    r2Client(),
    new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn }
  );
}
