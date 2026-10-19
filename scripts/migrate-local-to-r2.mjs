/**
 * One-shot migration: upload all files in /uploads/ to R2 and update DB URL references.
 * Run with: node scripts/migrate-local-to-r2.mjs
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync } from "fs";
import { extname, join } from "path";
import pg from "pg";

const { Pool } = pg;

const account = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const bucket  = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const keyId   = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secret  = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const pubUrl  = (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

if (!account || !bucket || !keyId || !secret || !pubUrl) {
  console.error("Missing R2 env vars"); process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL"); process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: keyId, secretAccessKey: secret },
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UPLOADS_DIR = "/home/runner/workspace/uploads";

const MIME_MAP = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4",
  ".webm": "video/webm", ".mp3": "audio/mpeg", ".wav": "audio/wav",
};
const mimeFor = (ext) => MIME_MAP[ext] ?? "application/octet-stream";
const folderFor = (mime) => mime.startsWith("video/") ? "videos" : mime.startsWith("image/") ? "images" : mime.startsWith("audio/") ? "audio" : "misc";

// All tables+columns that can store /api/uploads/ URLs
const URL_COLS = [
  { table: "videos",        cols: ["video_url", "thumbnail_url"] },
  { table: "dramas",        cols: ["poster_url"] },
  { table: "actors",        cols: ["photo_url"] },
  { table: "ads",           cols: ["media_url"] },
  { table: "users",         cols: ["photo_url"] },
  { table: "site_settings", cols: ["value"] },
  { table: "feedback",      cols: ["photo_url"] },
];

async function replaceUrl(oldUrl, newUrl) {
  let total = 0;
  for (const { table, cols } of URL_COLS) {
    for (const col of cols) {
      try {
        const r = await pool.query(`UPDATE ${table} SET ${col} = $1 WHERE ${col} = $2`, [newUrl, oldUrl]);
        if (r.rowCount > 0) {
          console.log(`  [DB] UPDATE ${table}.${col} rows=${r.rowCount}`);
          total += r.rowCount;
        }
      } catch { /* column doesn't exist on this table — skip */ }
    }
  }
  return total;
}

async function run() {
  const files = readdirSync(UPLOADS_DIR).filter(f => !f.startsWith("."));
  console.log(`\n=== Migrating ${files.length} local files to R2 ===\n`);

  let ok = 0, failed = 0;

  for (const filename of files) {
    const ext  = extname(filename).toLowerCase();
    const mime = mimeFor(ext);
    const folder = folderFor(mime);
    const r2Key  = `${folder}/${filename}`;
    const newUrl = `${pubUrl}/${r2Key}`;
    const oldUrl = `/api/uploads/${filename}`;
    const filePath = join(UPLOADS_DIR, filename);
    const size = statSync(filePath).size;

    console.log(`\n[R2] account=${account.slice(0,8)}...  bucket=${bucket}  operation=PutObject  key=${r2Key}`);

    try {
      const body = readFileSync(filePath);
      await r2.send(new PutObjectCommand({ Bucket: bucket, Key: r2Key, Body: body, ContentType: mime }));
      console.log(`[R2] status=success  size=${size}B  url=${newUrl}`);
    } catch (e) {
      console.error(`[R2] status=error  error=${e.name}: ${e.message}`);
      failed++;
      continue;
    }

    // Insert metadata record
    try {
      await pool.query(
        `INSERT INTO uploads (user_id, filename, original_name, mime_type, file_size, r2_key, public_url)
         VALUES (1, $1, $2, $3, $4, $5, $6) ON CONFLICT (r2_key) DO NOTHING`,
        [filename, filename, mime, size, r2Key, newUrl],
      );
      console.log(`[Supabase/DB] INSERT uploads  r2_key=${r2Key}  status=success`);
    } catch (e) {
      // uploads table may not have a unique constraint on r2_key yet — try without ON CONFLICT
      try {
        await pool.query(
          `INSERT INTO uploads (user_id, filename, original_name, mime_type, file_size, r2_key, public_url)
           VALUES (1, $1, $2, $3, $4, $5, $6)`,
          [filename, filename, mime, size, r2Key, newUrl],
        );
        console.log(`[Supabase/DB] INSERT uploads  status=success`);
      } catch (e2) {
        console.log(`[Supabase/DB] INSERT uploads  status=warn  error=${e2.message}`);
      }
    }

    // Update every DB URL reference
    const rows = await replaceUrl(oldUrl, newUrl);
    console.log(`[DB] URL references updated: ${rows} rows`);
    ok++;
  }

  console.log(`\n=== MIGRATION COMPLETE: ${ok} succeeded, ${failed} failed ===\n`);

  // Verify R2 bucket contents after migration
  const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
  const list = await r2.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 50 }));
  console.log(`[R2] Bucket '${bucket}' now contains ${list.KeyCount} objects:`);
  for (const obj of (list.Contents ?? [])) {
    console.log(`  key=${obj.Key}  size=${obj.Size}B`);
  }

  await pool.end();
}

run().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
