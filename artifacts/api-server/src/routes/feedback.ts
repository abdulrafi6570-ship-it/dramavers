import { Router, type IRouter } from "express";
import { db, userFeedbackTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { uploadToR2, isR2Configured } from "../lib/r2";

const UPLOADS_DIR = path.resolve(process.cwd(), "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      let ext = path.extname(file.originalname || "");
      if (!ext) {
        if (file.mimetype.startsWith("audio/webm")) ext = ".webm";
        else if (file.mimetype.startsWith("audio/ogg")) ext = ".ogg";
        else if (file.mimetype.startsWith("audio/")) ext = ".m4a";
        else if (file.mimetype.startsWith("image/")) ext = "." + file.mimetype.split("/")[1];
        else if (file.mimetype.startsWith("video/")) ext = "." + file.mimetype.split("/")[1];
        else ext = ".bin";
      }
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video, and audio files are allowed"));
    }
  },
});

const CreateFeedbackBody = z.object({
  message: z.string().min(0).max(2000).default(""),
  attachmentUrl: z.string().optional(),
  mimeType: z.string().optional(),
});

const UpdateStatusBody = z.object({
  status: z.enum(["new", "read", "resolved"]),
});

const router: IRouter = Router();

router.post("/feedback/upload", optionalAuth, upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  if (isR2Configured()) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const r2Url = await uploadToR2(req.file.filename, fileBuffer, req.file.mimetype);
      fs.unlink(req.file.path, () => {});
      res.json({ url: r2Url, mimetype: req.file.mimetype });
      return;
    } catch (err) {
      req.log.error({ err }, "R2 upload failed, falling back to local storage");
    }
  }

  res.json({ url: `/api/uploads/${req.file.filename}`, mimetype: req.file.mimetype });
});

router.post("/feedback", optionalAuth, async (req, res): Promise<void> => {
  const parsed = CreateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, attachmentUrl, mimeType } = parsed.data;
  if (!message && !attachmentUrl) {
    res.status(400).json({ error: "Message or attachment required" });
    return;
  }

  const [row] = await db.insert(userFeedbackTable).values({
    userId: req.user?.id ?? null,
    username: req.user?.username ?? null,
    message: message || "",
    imageUrl: attachmentUrl ?? null,
    mimeType: mimeType ?? null,
  }).returning();

  res.status(201).json({ id: row.id, status: row.status, createdAt: row.createdAt.toISOString() });
});

router.get("/admin/feedback", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const rows = await db.select().from(userFeedbackTable).orderBy(desc(userFeedbackTable.createdAt));
  res.json(rows.map(r => ({
    id: r.id,
    userId: r.userId,
    username: r.username,
    message: r.message,
    imageUrl: r.imageUrl,
    mimeType: r.mimeType,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.put("/admin/feedback/:id/status", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const id = Number(req.params.id);
  const parsed = UpdateStatusBody.safeParse(req.body);
  if (!parsed.success || isNaN(id)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  await db.update(userFeedbackTable).set({ status: parsed.data.status }).where(eq(userFeedbackTable.id, id));
  res.json({ success: true });
});

export default router;
