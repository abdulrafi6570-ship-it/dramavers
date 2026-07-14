import { Router, type IRouter } from "express";
import { db, favoritesTable, videosTable, dramasTable, actorsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { AddFavoriteParams, RemoveFavoriteParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatVideo(v: any, drama?: any, actor?: any) {
  return {
    id: v.id, title: v.title, dramaId: v.dramaId ?? null, actorId: v.actorId ?? null,
    dramaName: drama?.name ?? null, actorName: actor?.name ?? null,
    episode: v.episode ?? null, scene: v.scene ?? null,
    videoUrl: v.videoUrl ?? null, thumbnailUrl: v.thumbnailUrl ?? null,
    type: v.type, status: v.status,
    resolution: v.resolution ?? null, fps: v.fps ?? null, duration: v.duration ?? null,
    fileSize: v.fileSize ?? null, format: v.format ?? null, tags: v.tags ?? [],
    viewCount: v.viewCount ?? 0, downloadCount: v.downloadCount ?? 0, favoriteCount: v.favoriteCount ?? 0,
    popularityScore: v.popularityScore ?? null, isFavorited: true, isBookmarked: null,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  };
}

router.get("/favorites", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select({
    video: videosTable, drama: dramasTable, actor: actorsTable,
  }).from(favoritesTable)
    .innerJoin(videosTable, eq(favoritesTable.videoId, videosTable.id))
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(eq(favoritesTable.userId, req.user!.id));

  res.json(rows.map((r) => formatVideo(r.video, r.drama, r.actor)));
});

router.post("/favorites/:videoId", requireAuth, async (req, res): Promise<void> => {
  const params = AddFavoriteParams.safeParse({ videoId: Number(req.params.videoId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db.select().from(favoritesTable).where(
    and(eq(favoritesTable.userId, req.user!.id), eq(favoritesTable.videoId, params.data.videoId))
  );

  if (existing.length === 0) {
    await db.insert(favoritesTable).values({ userId: req.user!.id, videoId: params.data.videoId });
    await db.update(videosTable)
      .set({ favoriteCount: sql`favorite_count + 1`, popularityScore: sql`COALESCE(popularity_score, 0) + 1` })
      .where(eq(videosTable.id, params.data.videoId));
  }

  res.json({ success: true });
});

router.delete("/favorites/:videoId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse({ videoId: Number(req.params.videoId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(favoritesTable).where(
    and(eq(favoritesTable.userId, req.user!.id), eq(favoritesTable.videoId, params.data.videoId))
  );
  await db.update(videosTable)
    .set({ favoriteCount: sql`GREATEST(favorite_count - 1, 0)` })
    .where(eq(videosTable.id, params.data.videoId));

  res.sendStatus(204);
});

export default router;
