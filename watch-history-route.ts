import { Router, type IRouter } from "express";
import { db, videoViewsTable, videosTable, dramasTable, actorsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function formatVideo(v: any) {
  return {
    id: v.id, title: v.title, dramaId: v.dramaId ?? null, actorId: v.actorId ?? null,
    dramaName: v.dramaName ?? null, actorName: v.actorName ?? null,
    episode: v.episode ?? null, scene: v.scene ?? null,
    videoUrl: v.videoUrl ?? null, thumbnailUrl: v.thumbnailUrl ?? null,
    type: v.type, status: v.status,
    resolution: v.resolution ?? null, fps: v.fps ?? null, duration: v.duration ?? null,
    fileSize: v.fileSize ?? null, format: v.format ?? null, tags: v.tags ?? [],
    viewCount: v.viewCount ?? 0, downloadCount: v.downloadCount ?? 0, favoriteCount: v.favoriteCount ?? 0,
    popularityScore: v.popularityScore ?? null, isFavorited: null, isBookmarked: null,
    isOriginal: v.isOriginal ?? true, creditName: v.creditName ?? null, creditUrl: v.creditUrl ?? null,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  };
}

router.get("/watch-history", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select({ video: videosTable, dramaName: dramasTable.name, actorName: actorsTable.name })
    .from(videoViewsTable)
    .innerJoin(videosTable, eq(videoViewsTable.videoId, videosTable.id))
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(eq(videoViewsTable.userId, req.user!.id))
    .orderBy(desc(videoViewsTable.viewedAt))
    .limit(50);

  res.json(rows.map((r) => formatVideo({ ...r.video, dramaName: r.dramaName, actorName: r.actorName })));
});

export default router;
