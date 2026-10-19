import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import os from "os";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { assertR2Configured, uploadToR2, buildR2Key, type R2Folder } from "../lib/r2";
import { db, uploadsTable } from "@workspace/db";

const execAsync = promisify(exec);
const router: IRouter = Router();

// --- Use memory storage only — never write to local disk ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
});

function mimeToFolder(mime: string): R2Folder {
  if (mime.startsWith("video/")) return "videos";
  if (mime.startsWith("image/")) return "images";
  if (mime.startsWith("audio/")) return "audio";
  return "misc";
}

// ────────────────────────────────────────────────────────────
// POST /uploads  →  R2 upload + DB metadata insert
// ────────────────────────────────────────────────────────────
router.post("/uploads", requireAuth, requireAdmin, upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  // 1. Validate file presence
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  // 2. Validate R2 config — fail immediately if not configured
  try {
    assertR2Configured();
  } catch (err: any) {
    req.log.error({ err }, "[Upload] R2 not configured");
    res.status(503).json({ error: `Storage not configured: ${err.message}` });
    return;
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${randomUUID()}${ext}`;
  const folder = mimeToFolder(req.file.mimetype);
  const r2Key = buildR2Key(folder, filename);

  // 3. Upload to R2
  let publicUrl: string;
  try {
    publicUrl = await uploadToR2(r2Key, req.file.buffer, req.file.mimetype);
  } catch (err: any) {
    req.log.error({ err, r2Key }, "[Upload] R2 upload failed");
    res.status(502).json({
      error: "File upload to R2 failed",
      detail: err.message ?? String(err),
    });
    return;
  }

  // 4. Insert metadata to DB
  try {
    await db.insert(uploadsTable).values({
      userId: req.user!.id,
      filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      r2Key,
      publicUrl,
    });
    req.log.info({ table: "uploads", r2Key, publicUrl }, "[Supabase/DB] Insert success");
  } catch (err: any) {
    // File is already in R2 — log the metadata failure but still return the URL
    req.log.error({ err, r2Key }, "[Supabase/DB] Metadata insert failed (file is in R2)");
  }

  res.json({
    url: publicUrl,
    filename,
    r2Key,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// ────────────────────────────────────────────────────────────
// POST /uploads/mp3  →  convert video→MP3 in /tmp, upload to R2
// ────────────────────────────────────────────────────────────
router.post("/uploads/mp3", requireAuth, requireAdmin, upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    assertR2Configured();
  } catch (err: any) {
    req.log.error({ err }, "[Upload/mp3] R2 not configured");
    res.status(503).json({ error: `Storage not configured: ${err.message}` });
    return;
  }

  // Write input to a temp dir so ffmpeg can access it
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "twixtor-"));
  const inputPath = path.join(tmpDir, `input${path.extname(req.file.originalname)}`);
  const outputFilename = `${randomUUID()}.mp3`;
  const outputPath = path.join(tmpDir, outputFilename);

  try {
    await writeFile(inputPath, req.file.buffer);
    await execAsync(`ffmpeg -y -i "${inputPath}" -vn -acodec libmp3lame -q:a 2 "${outputPath}"`);

    const { readFile } = await import("fs/promises");
    const mp3Buffer = await readFile(outputPath);

    const r2Key = buildR2Key("audio", outputFilename);
    let publicUrl: string;
    try {
      publicUrl = await uploadToR2(r2Key, mp3Buffer, "audio/mpeg");
    } catch (err: any) {
      req.log.error({ err, r2Key }, "[Upload/mp3] R2 upload failed");
      res.status(502).json({
        error: "Audio upload to R2 failed",
        detail: err.message ?? String(err),
      });
      return;
    }

    // Insert metadata
    try {
      await db.insert(uploadsTable).values({
        userId: req.user!.id,
        filename: outputFilename,
        originalName: req.file.originalname,
        mimeType: "audio/mpeg",
        fileSize: mp3Buffer.length,
        r2Key,
        publicUrl,
      });
      req.log.info({ table: "uploads", r2Key, publicUrl }, "[Supabase/DB] MP3 metadata insert success");
    } catch (err: any) {
      req.log.error({ err, r2Key }, "[Supabase/DB] MP3 metadata insert failed (file is in R2)");
    }

    res.json({ url: publicUrl, filename: outputFilename, r2Key });
  } catch (err: any) {
    req.log.error({ err }, "[Upload/mp3] ffmpeg conversion failed");
    res.status(500).json({ error: "Audio conversion failed", detail: err.message ?? String(err) });
  } finally {
    // Always clean up tmp files
    unlink(inputPath).catch(() => {});
    unlink(outputPath).catch(() => {});
  }
});

export default router;
