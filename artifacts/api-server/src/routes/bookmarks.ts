import { Router, type IRouter } from "express";
import { db, bookmarksTable, videosTable, dramasTable, actorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { AddBookmarkParams, RemoveBookmarkParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookmarks", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select({
    video: videosTable, drama: dramasTable, actor: actorsTable,
  }).from(bookmarksTable)
    .innerJoin(videosTable, eq(bookmarksTable.videoId, videosTable.id))
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(eq(bookmarksTable.userId, req.user!.id));

  res.json(rows.map((r) => ({
    id: r.video.id, title: r.video.title, dramaId: r.video.dramaId ?? null, actorId: r.video.actorId ?? null,
    dramaName: r.drama?.name ?? null, actorName: r.actor?.name ?? null,
    episode: r.video.episode ?? null, scene: r.video.scene ?? null,
    videoUrl: r.video.videoUrl ?? null, thumbnailUrl: r.video.thumbnailUrl ?? null,
    type: r.video.type, status: r.video.status,
    resolution: r.video.resolution ?? null, fps: r.video.fps ?? null, duration: r.video.duration ?? null,
    fileSize: r.video.fileSize ?? null, format: r.video.format ?? null, tags: r.video.tags ?? [],
    viewCount: r.video.viewCount, downloadCount: r.video.downloadCount, favoriteCount: r.video.favoriteCount,
    popularityScore: r.video.popularityScore ?? null, isFavorited: null, isBookmarked: true,
    createdAt: r.video.createdAt.toISOString(),
  })));
});

router.post("/bookmarks/:videoId", requireAuth, async (req, res): Promise<void> => {
  const params = AddBookmarkParams.safeParse({ videoId: Number(req.params.videoId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db.select().from(bookmarksTable).where(
    and(eq(bookmarksTable.userId, req.user!.id), eq(bookmarksTable.videoId, params.data.videoId))
  );

  if (existing.length === 0) {
    await db.insert(bookmarksTable).values({ userId: req.user!.id, videoId: params.data.videoId });
  }

  res.json({ success: true });
});

router.delete("/bookmarks/:videoId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveBookmarkParams.safeParse({ videoId: Number(req.params.videoId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(bookmarksTable).where(
    and(eq(bookmarksTable.userId, req.user!.id), eq(bookmarksTable.videoId, params.data.videoId))
  );
  res.sendStatus(204);
});

export default router;
