import { Router, type IRouter } from "express";
import { db, commentsTable, commentLikesTable, usersTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import { DeleteCommentParams } from "@workspace/api-zod";
import { z } from "zod";

const VideoIdParam = z.object({ id: z.coerce.number().int().positive() });
const CommentBodyWithVideo = z.object({
  videoId: z.coerce.number().int().positive(),
  text: z.string().min(1).max(2000),
  parentId: z.coerce.number().int().optional().nullable(),
});

const router: IRouter = Router();

async function fetchCommentsForVideo(videoId: number) {
  const topLevel = await db.select({
    comment: commentsTable,
    username: usersTable.username,
    photoUrl: usersTable.photoUrl,
  }).from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(and(eq(commentsTable.videoId, videoId), isNull(commentsTable.parentId)))
    .orderBy(commentsTable.createdAt);

  const replies = await db.select({
    comment: commentsTable,
    username: usersTable.username,
    photoUrl: usersTable.photoUrl,
  }).from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(eq(commentsTable.videoId, videoId));

  const replyMap = new Map<number, any[]>();
  for (const r of replies) {
    if (r.comment.parentId) {
      if (!replyMap.has(r.comment.parentId)) replyMap.set(r.comment.parentId, []);
      replyMap.get(r.comment.parentId)!.push({
        id: r.comment.id, text: r.comment.text, userId: r.comment.userId,
        username: r.username, photoUrl: r.photoUrl ?? null,
        videoId: r.comment.videoId, parentId: r.comment.parentId, likeCount: r.comment.likeCount, replies: [],
        createdAt: r.comment.createdAt.toISOString(),
      });
    }
  }

  return topLevel.map((r) => ({
    id: r.comment.id, text: r.comment.text, userId: r.comment.userId,
    username: r.username, photoUrl: r.photoUrl ?? null,
    videoId: r.comment.videoId, parentId: null, likeCount: r.comment.likeCount,
    replies: replyMap.get(Number(r.comment.id)) ?? [],
    createdAt: r.comment.createdAt.toISOString(),
  }));
}

router.get("/comments", optionalAuth, async (req, res): Promise<void> => {
  const videoIdParam = z.coerce.number().int().positive().safeParse(req.query.videoId);
  if (!videoIdParam.success) { res.status(400).json({ error: "Missing or invalid videoId" }); return; }
  res.json(await fetchCommentsForVideo(videoIdParam.data));
});

router.post("/comments", requireAuth, async (req, res): Promise<void> => {
  const parsed = CommentBodyWithVideo.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [comment] = await db.insert(commentsTable).values({
    userId: req.user!.id,
    videoId: parsed.data.videoId,
    text: parsed.data.text,
    parentId: parsed.data.parentId ?? null,
  }).returning();

  res.status(201).json({
    id: comment.id, text: comment.text, userId: comment.userId, username: req.user!.username,
    photoUrl: req.user!.photoUrl ?? null,
    videoId: comment.videoId, parentId: comment.parentId ?? null, likeCount: comment.likeCount, replies: [],
    createdAt: comment.createdAt.toISOString(),
  });
});

router.get("/videos/:id/comments", optionalAuth, async (req, res): Promise<void> => {
  const params = VideoIdParam.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  res.json(await fetchCommentsForVideo(params.data.id));
});

router.post("/videos/:id/comments", requireAuth, async (req, res): Promise<void> => {
  const params = VideoIdParam.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = z.object({ text: z.string().min(1).max(2000), parentId: z.coerce.number().int().optional().nullable() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [comment] = await db.insert(commentsTable).values({
    userId: req.user!.id,
    videoId: params.data.id,
    text: parsed.data.text,
    parentId: parsed.data.parentId ?? null,
  }).returning();

  res.status(201).json({
    id: comment.id, text: comment.text, userId: comment.userId, username: req.user!.username,
    photoUrl: req.user!.photoUrl ?? null,
    videoId: comment.videoId, parentId: comment.parentId ?? null, likeCount: comment.likeCount, replies: [],
    createdAt: comment.createdAt.toISOString(),
  });
});


router.patch("/comments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = z.object({ text: z.string().min(1).max(2000) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid text" }); return; }
  const rows = await db.select().from(commentsTable).where(eq(commentsTable.id, id));
  if (!rows.length) { res.status(404).json({ error: "Not found" }); return; }
  if (rows[0].userId !== req.user!.id && req.user!.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const [updated] = await db.update(commentsTable).set({ text: parsed.data.text }).where(eq(commentsTable.id, id)).returning();
  res.json({ id: updated.id, text: updated.text });
});

router.delete("/comments/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCommentParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, params.data.id));
  if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }
  if (comment.userId !== req.user!.id && req.user!.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/comments/:id/like", requireAuth, async (req, res): Promise<void> => {
  const params = VideoIdParam.safeParse({ id: Number(req.params.id) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const existing = await db.select().from(commentLikesTable).where(
    and(eq(commentLikesTable.userId, req.user!.id), eq(commentLikesTable.commentId, params.data.id))
  );
  if (existing.length === 0) {
    await db.insert(commentLikesTable).values({ userId: req.user!.id, commentId: params.data.id });
  }
  res.json({ success: true });
});

export default router;

// DEBUG TEMP - hapus setelah debug selesai
router.get("/debug/comments/:videoId", async (req, res): Promise<void> => {
  const videoId = Number(req.params.videoId);
  const rows = await db.select({ id: commentsTable.id, text: commentsTable.text, parentId: commentsTable.parentId }).from(commentsTable).where(eq(commentsTable.videoId, videoId)).orderBy(commentsTable.id);
  res.json(rows);
});
