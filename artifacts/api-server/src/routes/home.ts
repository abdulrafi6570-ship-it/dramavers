import { Router, type IRouter } from "express";
import { db, videosTable, dramasTable, actorsTable, usersTable } from "@workspace/db";
import { eq, ilike, desc, count, gt, and } from "drizzle-orm";

const router: IRouter = Router();

function fixMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const oldRailway = "https://dramavers-production.up.railway.app";

  if (url.startsWith(oldRailway)) {
    return url.replace(oldRailway, "");
  }

  return url;
}

function formatVideo(v: any) {
  return {
    id: v.id,
    title: v.title,
    dramaId: v.dramaId ?? null,
    actorId: v.actorId ?? null,
    dramaName: v.dramaName ?? null,
    actorName: v.actorName ?? null,
    episode: v.episode ?? null,
    scene: v.scene ?? null,
    videoUrl: fixMediaUrl(v.videoUrl),
    thumbnailUrl: fixMediaUrl(v.thumbnailUrl),
    type: v.type,
    status: v.status,
    resolution: v.resolution ?? null,
    fps: v.fps ?? null,
    duration: v.duration ?? null,
    fileSize: v.fileSize ?? null,
    format: v.format ?? null,
    tags: v.tags ?? [],
    viewCount: v.viewCount ?? 0,
    downloadCount: v.downloadCount ?? 0,
    favoriteCount: v.favoriteCount ?? 0,
    popularityScore: v.popularityScore ?? null,
    isFavorited: null,
    isBookmarked: null,
    createdAt:
      v.createdAt instanceof Date
        ? v.createdAt.toISOString()
        : v.createdAt,
  };
}

function formatDrama(d: any) {
  return {
    id: d.id,
    name: d.name,
    category: d.parentCategory ?? "ASIA",
    subcategory: d.subcategory ?? null,
    genre: d.genre ?? null,
    description: d.description ?? null,
    posterUrl: fixMediaUrl(d.posterUrl),
    videoCount: d.videoCount ?? 0,
    createdAt:
      d.createdAt instanceof Date
        ? d.createdAt.toISOString()
        : d.createdAt,
  };
}

router.get("/home", async (_req, res): Promise<void> => {
  const [
    featuredDramas,
    soloActors,
    recentVideosRaw,
    popularVideosRaw,
    statsRows,
  ] = await Promise.all([
    db
      .select()
      .from(dramasTable)
      .orderBy(desc(dramasTable.createdAt))
      .limit(8),

    db
      .select()
      .from(actorsTable)
      .where(eq(actorsTable.type, "solo"))
      .orderBy(desc(actorsTable.createdAt))
      .limit(10),

    db
      .select({
        video: videosTable,
        dramaName: dramasTable.name,
        actorName: actorsTable.name,
      })
      .from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(eq(videosTable.status, "published"))
      .orderBy(desc(videosTable.createdAt))
      .limit(12),

    db
      .select({
        video: videosTable,
        dramaName: dramasTable.name,
        actorName: actorsTable.name,
      })
      .from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(
        and(
          eq(videosTable.status, "published"),
          gt(videosTable.viewCount, 0),
        ),
      )
      .orderBy(
        desc(videosTable.viewCount),
        desc(videosTable.popularityScore),
        desc(videosTable.downloadCount),
      )
      .limit(12),

    Promise.all([
      db.select({ total: count() }).from(dramasTable),
      db.select({ total: count() }).from(actorsTable),
      db
        .select({ total: count() })
        .from(videosTable)
        .where(eq(videosTable.status, "published")),
    ]),
  ]);

  const [dramaCount, actorCount, videoCount] = statsRows;

  res.json({
    featuredDramas: featuredDramas.map(formatDrama),

    featuredSoloActors: soloActors.map((a) => ({
      id: a.id,
      name: a.name,
      photoUrl: fixMediaUrl(a.photoUrl),
    })),

    recentVideos: recentVideosRaw.map((r) =>
      formatVideo({
        ...r.video,
        dramaName: r.dramaName,
        actorName: r.actorName,
      }),
    ),

    popularVideos: popularVideosRaw.map((r) =>
      formatVideo({
        ...r.video,
        dramaName: r.dramaName,
        actorName: r.actorName,
      }),
    ),

    stats: {
      totalDramas: Number(dramaCount[0].total),
      totalActors: Number(actorCount[0].total),
      totalVideos: Number(videoCount[0].total),
    },
  });
});

router.get("/search", async (req, res): Promise<void> => {
  const q = (req.query.q as string | undefined) ?? "";

  if (!q || q.length < 2) {
    res.json({
      dramas: [],
      actors: [],
      videos: [],
    });
    return;
  }

  const [dramas, actors, users, videos] = await Promise.all([
    db
      .select()
      .from(dramasTable)
      .where(ilike(dramasTable.name, `%${q}%`))
      .limit(8),

    db
      .select()
      .from(actorsTable)
      .where(ilike(actorsTable.name, `%${q}%`))
      .limit(8),

    db
      .select()
      .from(usersTable)
      .where(ilike(usersTable.username, `%${q}%`))
      .limit(8),

    db
      .select({
        video: videosTable,
        dramaName: dramasTable.name,
        actorName: actorsTable.name,
      })
      .from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(
        and(
          eq(videosTable.status, "published"),
          ilike(videosTable.title, `%${q}%`),
        ),
      )
      .limit(12),
  ]);

  res.json({
    dramas: dramas.map(formatDrama),

    actors: actors.map((a) => ({
      id: a.id,
      name: a.name,
      photoUrl: fixMediaUrl(a.photoUrl),
      type: a.type ?? "drama",
      bio: a.bio ?? null,
      videoCount: 0,
      createdAt:
        a.createdAt instanceof Date
          ? a.createdAt.toISOString()
          : a.createdAt,
    })),

    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      photoUrl: fixMediaUrl(u.photoUrl),
      verified: u.verified,
    })),

    videos: videos.map((r) =>
      formatVideo({
        ...r.video,
        dramaName: r.dramaName,
        actorName: r.actorName,
      }),
    ),
  });
});

export default router;
