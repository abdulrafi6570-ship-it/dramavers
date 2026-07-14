import { Router, type IRouter } from "express";
import { db, downloadsTable, videosTable, dramasTable, actorsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const ListDownloadsQueryParams = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const router: IRouter = Router();

router.get("/downloads", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListDownloadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 20 } = parsed.data;
  const offset = ((page as number) - 1) * (limit as number);

  const rows = await db.select({
    download: downloadsTable,
    video: videosTable,
    drama: dramasTable,
    actor: actorsTable,
  }).from(downloadsTable)
    .innerJoin(videosTable, eq(downloadsTable.videoId, videosTable.id))
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(eq(downloadsTable.userId, req.user!.id))
    .orderBy(desc(downloadsTable.createdAt))
    .limit(limit as number).offset(offset);

  res.json(rows.map((r) => ({
    id: r.download.id,
    video: {
      id: r.video.id, title: r.video.title, dramaId: r.video.dramaId ?? null, actorId: r.video.actorId ?? null,
      dramaName: r.drama?.name ?? null, actorName: r.actor?.name ?? null,
      episode: r.video.episode ?? null, scene: r.video.scene ?? null,
      videoUrl: r.video.videoUrl ?? null, thumbnailUrl: r.video.thumbnailUrl ?? null,
      type: r.video.type, status: r.video.status,
      resolution: r.video.resolution ?? null, fps: r.video.fps ?? null, duration: r.video.duration ?? null,
      fileSize: r.video.fileSize ?? null, format: r.video.format ?? null, tags: r.video.tags ?? [],
      viewCount: r.video.viewCount, downloadCount: r.video.downloadCount, favoriteCount: r.video.favoriteCount,
      popularityScore: r.video.popularityScore ?? null, isFavorited: null, isBookmarked: null,
      createdAt: r.video.createdAt.toISOString(),
    },
    downloadedAt: r.download.createdAt.toISOString(),
  })));
});

export default router;
