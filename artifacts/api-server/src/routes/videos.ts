import { Router, type IRouter } from "express";
import { db, videosTable, dramasTable, actorsTable, favoritesTable, bookmarksTable, downloadsTable, ratingsTable , videoViewsTable } from "@workspace/db";
import { eq, ilike, and, or, sql, count, desc, asc } from "drizzle-orm";
import { requireAuth, requireVerified, optionalAuth, requireAdmin } from "../middlewares/auth";
import {
  ListVideosQueryParams, CreateVideoBody, GetVideoParams,
  UpdateVideoParams, UpdateVideoBody, DeleteVideoParams,
  RecordViewParams, DownloadVideoParams, RateVideoParams, RateVideoBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatVideo(v: any, userId?: number, favoriteIds?: Set<number>, bookmarkIds?: Set<number>) {
  return {
    id: v.id, title: v.title, dramaId: v.dramaId ?? null, actorId: v.actorId ?? null,
    dramaName: v.dramaName ?? null, actorName: v.actorName ?? null,
    episode: v.episode ?? null, scene: v.scene ?? null,
    videoUrl: v.videoUrl ?? null, thumbnailUrl: v.thumbnailUrl ?? null,
    type: v.type, status: v.status,
    resolution: v.resolution ?? null, fps: v.fps ?? null, duration: v.duration ?? null,
    fileSize: v.fileSize ?? null, format: v.format ?? null, tags: v.tags ?? [],
    viewCount: v.viewCount ?? 0, downloadCount: v.downloadCount ?? 0, favoriteCount: v.favoriteCount ?? 0,
    popularityScore: v.popularityScore ?? null,
    isFavorited: userId && favoriteIds ? favoriteIds.has(v.id) : null,
    isBookmarked: userId && bookmarkIds ? bookmarkIds.has(v.id) : null,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  };
}

router.get("/videos", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListVideosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { dramaId, actorId, type, resolution, fps, search, tags, status, page = 1, limit = 20 } = parsed.data;

  const conditions: any[] = [];
  if (!req.user?.role || req.user.role !== "admin") {
    conditions.push(eq(videosTable.status, "published"));
  } else if (status) {
    conditions.push(eq(videosTable.status, status as any));
  }
  if (dramaId) conditions.push(eq(videosTable.dramaId, dramaId as number));
  if (actorId) conditions.push(eq(videosTable.actorId, actorId as number));
  if (type) conditions.push(eq(videosTable.type, type as any));
  if (resolution) conditions.push(eq(videosTable.resolution, resolution as string));
  if (fps) conditions.push(eq(videosTable.fps, fps as number));
  if (search) conditions.push(ilike(videosTable.title, `%${search}%`));

  const offset = ((page as number) - 1) * (limit as number);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rawVideos, [{ total }]] = await Promise.all([
    db.select({
      video: videosTable,
      dramaName: dramasTable.name,
      actorName: actorsTable.name,
    }).from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(where)
      .orderBy(desc(videosTable.popularityScore), desc(videosTable.createdAt))
      .limit(limit as number).offset(offset),
    db.select({ total: count() }).from(videosTable).where(where),
  ]);

  let favoriteIds = new Set<number>();
  let bookmarkIds = new Set<number>();
  if (req.user) {
    const [favs, bmarks] = await Promise.all([
      db.select({ videoId: favoritesTable.videoId }).from(favoritesTable).where(eq(favoritesTable.userId, req.user.id)),
      db.select({ videoId: bookmarksTable.videoId }).from(bookmarksTable).where(eq(bookmarksTable.userId, req.user.id)),
    ]);
    favoriteIds = new Set(favs.map((f) => f.videoId));
    bookmarkIds = new Set(bmarks.map((b) => b.videoId));
  }

  const videos = rawVideos.map((r) => formatVideo({ ...r.video, dramaName: r.dramaName, actorName: r.actorName }, req.user?.id, favoriteIds, bookmarkIds));

  res.json({ videos, total: Number(total), page: page as number, limit: limit as number });
});

router.post("/videos", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [video] = await db.insert(videosTable).values(parsed.data as any).returning();
  res.status(201).json(formatVideo(video));
});

router.get("/videos/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetVideoParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const [row] = await db.select({
    video: videosTable,
    drama: dramasTable,
    actor: actorsTable,
  }).from(videosTable)
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(eq(videosTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  let isFavorited = null;
  let isBookmarked = null;
  if (req.user) {
    const [fav] = await db.select().from(favoritesTable).where(and(eq(favoritesTable.userId, req.user.id), eq(favoritesTable.videoId, id)));
    const [bmark] = await db.select().from(bookmarksTable).where(and(eq(bookmarksTable.userId, req.user.id), eq(bookmarksTable.videoId, id)));
    isFavorited = !!fav;
    isBookmarked = !!bmark;
  }

  // Average rating
  const [avgRow] = await db.select({
    avg: sql<number>`avg(rating)`,
  }).from(ratingsTable).where(eq(ratingsTable.videoId, id));

  // Related videos
  const related = await db.select({
    video: videosTable,
    dramaName: dramasTable.name,
    actorName: actorsTable.name,
  }).from(videosTable)
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(and(
      eq(videosTable.status, "published"),
      eq(videosTable.dramaId, row.video.dramaId ?? -1),
    ))
    .limit(6);

  const v = row.video;
  res.json({
    id: v.id, title: v.title,
    drama: row.drama ? { id: row.drama.id, name: row.drama.name, posterUrl: row.drama.posterUrl ?? null, description: row.drama.description ?? null, category: row.drama.category, genre: row.drama.genre ?? null, videoCount: null, createdAt: row.drama.createdAt.toISOString() } : null,
    actor: row.actor ? { id: row.actor.id, name: row.actor.name, photoUrl: row.actor.photoUrl ?? null, videoCount: null, createdAt: row.actor.createdAt.toISOString() } : null,
    episode: v.episode ?? null, scene: v.scene ?? null,
    videoUrl: v.videoUrl ?? null, thumbnailUrl: v.thumbnailUrl ?? null,
    type: v.type, status: v.status,
    resolution: v.resolution ?? null, fps: v.fps ?? null, duration: v.duration ?? null,
    fileSize: v.fileSize ?? null, format: v.format ?? null, tags: v.tags ?? [],
    viewCount: v.viewCount, downloadCount: v.downloadCount, favoriteCount: v.favoriteCount,
    popularityScore: v.popularityScore ?? null,
    averageRating: avgRow?.avg ? Number(avgRow.avg) : null,
    isFavorited, isBookmarked,
    relatedVideos: related.map((r) => formatVideo({ ...r.video, dramaName: r.dramaName, actorName: r.actorName })),
    createdAt: v.createdAt.toISOString(),
  });
});

router.patch("/videos/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateVideoParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [video] = await db.update(videosTable).set(parsed.data as any).where(eq(videosTable.id, params.data.id)).returning();
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }
  res.json(formatVideo(video));
});

router.delete("/videos/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteVideoParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(videosTable).where(eq(videosTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/videos/:id/view", optionalAuth, async (req, res): Promise<void> => {
  const params = RecordViewParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const videoId = params.data.id;
  const userId = req.user?.id ?? null;
  const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim() || null;

  // Cek apakah sudah pernah ditonton (user atau IP)
  let alreadyViewed = false;
  try {
    if (userId !== null) {
      const [existing] = await db.select({ id: videoViewsTable.id })
        .from(videoViewsTable)
        .where(eq(videoViewsTable.videoId, videoId) && eq(videoViewsTable.userId, userId))
        .limit(1);
      alreadyViewed = !!existing;
    } else if (ip) {
      const [existing] = await db.select({ id: videoViewsTable.id })
        .from(videoViewsTable)
        .where(eq(videoViewsTable.videoId, videoId) && eq(videoViewsTable.ipAddress, ip))
        .limit(1);
      alreadyViewed = !!existing;
    }
  } catch { alreadyViewed = false; }

  if (!alreadyViewed) {
    try {
      await db.insert(videoViewsTable).values({
        videoId,
        userId: userId ?? undefined,
        ipAddress: userId ? null : ip,
      });
      await db.update(videosTable)
        .set({ viewCount: sql`view_count + 1`, popularityScore: sql`COALESCE(popularity_score, 0) + 0.5` })
        .where(eq(videosTable.id, videoId));
    } catch { /* conflict — sudah ada, abaikan */ }
  }

  res.json({ success: true });
});

router.post("/videos/:id/download", requireAuth, requireVerified, async (req, res): Promise<void> => {
  const params = DownloadVideoParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  await db.insert(downloadsTable).values({ userId: req.user!.id, videoId: params.data.id });
  await db.update(videosTable)
    .set({ downloadCount: sql`download_count + 1`, popularityScore: sql`COALESCE(popularity_score, 0) + 2` })
    .where(eq(videosTable.id, params.data.id));

  res.json({ videoUrl: video.videoUrl ?? "", title: video.title });
});

router.post("/videos/:id/rate", requireAuth, async (req, res): Promise<void> => {
  const params = RateVideoParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = RateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(ratingsTable).where(
    and(eq(ratingsTable.userId, req.user!.id), eq(ratingsTable.videoId, params.data.id))
  );

  if (existing.length > 0) {
    await db.update(ratingsTable).set(parsed.data).where(
      and(eq(ratingsTable.userId, req.user!.id), eq(ratingsTable.videoId, params.data.id))
    );
  } else {
    await db.insert(ratingsTable).values({ userId: req.user!.id, videoId: params.data.id, ...parsed.data });
  }

  res.json({ success: true });
});

export default router;
