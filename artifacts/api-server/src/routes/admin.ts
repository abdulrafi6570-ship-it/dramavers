import { Router, type IRouter } from "express";
import { db, usersTable, videosTable, dramasTable, actorsTable, downloadsTable, favoritesTable, accessCodesTable, videoViewsTable, dramaFavoritesTable } from "@workspace/db";
import { eq, and, desc, count, gt, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  ListUsersQueryParams, CreateAccessCodeBody, DeleteAccessCodeParams, BulkUpdateVideosBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/stats", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const [[{ totalUsers }], [{ totalVideos }], [{ totalDramas }], [{ totalActors }], [{ totalDownloads }]] = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
    db.select({ totalVideos: count() }).from(videosTable),
    db.select({ totalDramas: count() }).from(dramasTable),
    db.select({ totalActors: count() }).from(actorsTable),
    db.select({ totalDownloads: count() }).from(downloadsTable),
  ]);

  const popularVideos = await db.select({ id: videosTable.id, title: videosTable.title, downloadCount: videosTable.downloadCount, viewCount: videosTable.viewCount, favoriteCount: videosTable.favoriteCount, thumbnailUrl: videosTable.thumbnailUrl, type: videosTable.type, status: videosTable.status, dramaId: videosTable.dramaId, actorId: videosTable.actorId, episode: videosTable.episode, scene: videosTable.scene, videoUrl: videosTable.videoUrl, resolution: videosTable.resolution, fps: videosTable.fps, duration: videosTable.duration, fileSize: videosTable.fileSize, format: videosTable.format, tags: videosTable.tags, popularityScore: videosTable.popularityScore, createdAt: videosTable.createdAt })
    .from(videosTable)
    .orderBy(desc(videosTable.downloadCount))
    .limit(5);

  res.json({
    totalUsers: Number(totalUsers),
    totalVideos: Number(totalVideos),
    totalDramas: Number(totalDramas),
    totalActors: Number(totalActors),
    totalDownloads: Number(totalDownloads),
    totalViews: 0,
    totalFavorites: 0,
    popularVideos: popularVideos.map((v) => ({
      id: v.id, title: v.title, dramaId: v.dramaId ?? null, actorId: v.actorId ?? null,
      dramaName: null, actorName: null, episode: v.episode ?? null, scene: v.scene ?? null,
      videoUrl: v.videoUrl ?? null, thumbnailUrl: v.thumbnailUrl ?? null,
      type: v.type, status: v.status,
      resolution: v.resolution ?? null, fps: v.fps ?? null, duration: v.duration ?? null,
      fileSize: v.fileSize ?? null, format: v.format ?? null, tags: v.tags ?? [],
      viewCount: v.viewCount, downloadCount: v.downloadCount, favoriteCount: v.favoriteCount,
      popularityScore: v.popularityScore ?? null, isFavorited: null, isBookmarked: null,
      createdAt: v.createdAt.toISOString(),
    })),
    storageVideoCount: Number(totalVideos),
    storageUsedBytes: null,
  });
});

router.get("/admin/analytics", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const [viewsPerDayRows, viewsByHourRows, topVideos, topDramasRows] = await Promise.all([
    db.select({
      day: sql<string>`to_char(${videoViewsTable.viewedAt}, 'YYYY-MM-DD')`,
      cnt: count(),
    }).from(videoViewsTable)
      .where(sql`${videoViewsTable.viewedAt} > now() - interval '30 days'`)
      .groupBy(sql`to_char(${videoViewsTable.viewedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${videoViewsTable.viewedAt}, 'YYYY-MM-DD')`),

    db.select({
      hour: sql<number>`extract(hour from ${videoViewsTable.viewedAt})::int`,
      cnt: count(),
    }).from(videoViewsTable)
      .groupBy(sql`extract(hour from ${videoViewsTable.viewedAt})`)
      .orderBy(sql`extract(hour from ${videoViewsTable.viewedAt})`),

    db.select({ id: videosTable.id, title: videosTable.title, viewCount: videosTable.viewCount, thumbnailUrl: videosTable.thumbnailUrl })
      .from(videosTable)
      .orderBy(desc(videosTable.viewCount))
      .limit(10),

    db.select({
      id: dramasTable.id, name: dramasTable.name, posterUrl: dramasTable.posterUrl, cnt: count(),
    }).from(dramaFavoritesTable)
      .innerJoin(dramasTable, eq(dramaFavoritesTable.dramaId, dramasTable.id))
      .groupBy(dramasTable.id, dramasTable.name, dramasTable.posterUrl)
      .orderBy(desc(count()))
      .limit(10),
  ]);

  res.json({
    viewsPerDay: viewsPerDayRows.map((r) => ({ date: r.day, count: Number(r.cnt) })),
    viewsByHour: viewsByHourRows.map((r) => ({ hour: Number(r.hour), count: Number(r.cnt) })),
    topVideos: topVideos.map((v) => ({ id: v.id, title: v.title, viewCount: v.viewCount ?? 0, thumbnailUrl: v.thumbnailUrl ?? null })),
    topDramas: topDramasRows.map((r) => ({ id: r.id, name: r.name, posterUrl: r.posterUrl ?? null, favoriteCount: Number(r.cnt) })),
  });
});

router.get("/admin/access-codes", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const codes = await db.select().from(accessCodesTable).orderBy(desc(accessCodesTable.createdAt));
  res.json(codes.map((c) => ({
    id: c.id, code: c.code, active: c.active,
    expiredAt: c.expiredAt ? c.expiredAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/admin/access-codes", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateAccessCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [code] = await db.insert(accessCodesTable).values({
    code: parsed.data.code,
    active: true,
    expiredAt: parsed.data.expiredAt ? new Date(parsed.data.expiredAt) : null,
  }).returning();

  res.status(201).json({
    id: code.id, code: code.code, active: code.active,
    expiredAt: code.expiredAt ? code.expiredAt.toISOString() : null,
    createdAt: code.createdAt.toISOString(),
  });
});

router.delete("/admin/access-codes/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteAccessCodeParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(accessCodesTable).where(eq(accessCodesTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  const { page = 1, limit = 20 } = parsed.success ? parsed.data : {};
  const offset = ((page as number) - 1) * (limit as number);

  const [users, [{ total }]] = await Promise.all([
    db.select().from(usersTable).limit(limit as number).offset(offset).orderBy(desc(usersTable.createdAt)),
    db.select({ total: count() }).from(usersTable),
  ]);

  res.json({
    users: users.map((u) => ({
      id: u.id, username: u.username, role: u.role, verified: u.verified,
      totalDownloads: null, totalFavorites: null, createdAt: u.createdAt.toISOString(),
    })),
    total: Number(total),
    page: page as number,
    limit: limit as number,
  });
});

router.post("/admin/videos/bulk", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = BulkUpdateVideosBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { videoIds, action } = parsed.data;

  if (action === "publish") {
    for (const id of videoIds) {
      await db.update(videosTable).set({ status: "published" }).where(eq(videosTable.id, id));
    }
  } else if (action === "unpublish") {
    for (const id of videoIds) {
      await db.update(videosTable).set({ status: "hidden" }).where(eq(videosTable.id, id));
    }
  } else if (action === "delete") {
    for (const id of videoIds) {
      await db.delete(videosTable).where(eq(videosTable.id, id));
    }
  }

  res.json({ success: true });
});

export default router;
