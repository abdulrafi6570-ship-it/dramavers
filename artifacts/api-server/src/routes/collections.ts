import { Router, type IRouter } from "express";
import { db, collectionsTable, collectionVideosTable, videosTable, dramasTable, actorsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

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

const CreateCollectionBody = z.object({ name: z.string().min(1).max(60) });
const RenameCollectionBody = z.object({ name: z.string().min(1).max(60) });

async function assertOwnsCollection(collectionId: number, userId: number) {
  const [row] = await db.select().from(collectionsTable).where(
    and(eq(collectionsTable.id, collectionId), eq(collectionsTable.userId, userId))
  );
  return row ?? null;
}

router.get("/collections", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select().from(collectionsTable)
    .where(eq(collectionsTable.userId, req.user!.id))
    .orderBy(desc(collectionsTable.createdAt));

  const withCovers = await Promise.all(rows.map(async (c) => {
    const [[{ total }], [cover]] = await Promise.all([
      db.select({ total: count() }).from(collectionVideosTable).where(eq(collectionVideosTable.collectionId, c.id)),
      db.select({ thumbnailUrl: videosTable.thumbnailUrl })
        .from(collectionVideosTable)
        .innerJoin(videosTable, eq(collectionVideosTable.videoId, videosTable.id))
        .where(eq(collectionVideosTable.collectionId, c.id))
        .orderBy(desc(collectionVideosTable.addedAt))
        .limit(1),
    ]);
    return {
      id: c.id,
      name: c.name,
      videoCount: Number(total),
      coverUrl: cover?.thumbnailUrl ?? null,
      createdAt: c.createdAt.toISOString(),
    };
  }));

  res.json(withCovers);
});

router.post("/collections", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [created] = await db.insert(collectionsTable).values({
    userId: req.user!.id,
    name: parsed.data.name,
  }).returning();

  res.status(201).json({ id: created.id, name: created.name, videoCount: 0, coverUrl: null, createdAt: created.createdAt.toISOString() });
});

router.patch("/collections/:id", requireAuth, async (req, res): Promise<void> => {
  const collectionId = Number(req.params.id);
  const owned = await assertOwnsCollection(collectionId, req.user!.id);
  if (!owned) { res.status(404).json({ error: "Koleksi tidak ditemukan" }); return; }

  const parsed = RenameCollectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.update(collectionsTable).set({ name: parsed.data.name }).where(eq(collectionsTable.id, collectionId));
  res.json({ success: true });
});

router.delete("/collections/:id", requireAuth, async (req, res): Promise<void> => {
  const collectionId = Number(req.params.id);
  const owned = await assertOwnsCollection(collectionId, req.user!.id);
  if (!owned) { res.status(404).json({ error: "Koleksi tidak ditemukan" }); return; }

  await db.delete(collectionsTable).where(eq(collectionsTable.id, collectionId));
  res.json({ success: true });
});

router.get("/collections/:id", requireAuth, async (req, res): Promise<void> => {
  const collectionId = Number(req.params.id);
  const owned = await assertOwnsCollection(collectionId, req.user!.id);
  if (!owned) { res.status(404).json({ error: "Koleksi tidak ditemukan" }); return; }

  const rows = await db.select({ video: videosTable, dramaName: dramasTable.name, actorName: actorsTable.name })
    .from(collectionVideosTable)
    .innerJoin(videosTable, eq(collectionVideosTable.videoId, videosTable.id))
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(eq(collectionVideosTable.collectionId, collectionId))
    .orderBy(desc(collectionVideosTable.addedAt));

  res.json({
    id: owned.id,
    name: owned.name,
    createdAt: owned.createdAt.toISOString(),
    videos: rows.map((r) => formatVideo({ ...r.video, dramaName: r.dramaName, actorName: r.actorName })),
  });
});

router.post("/collections/:id/videos/:videoId", requireAuth, async (req, res): Promise<void> => {
  const collectionId = Number(req.params.id);
  const videoId = Number(req.params.videoId);
  const owned = await assertOwnsCollection(collectionId, req.user!.id);
  if (!owned) { res.status(404).json({ error: "Koleksi tidak ditemukan" }); return; }

  const existing = await db.select().from(collectionVideosTable).where(
    and(eq(collectionVideosTable.collectionId, collectionId), eq(collectionVideosTable.videoId, videoId))
  );
  if (existing.length === 0) {
    await db.insert(collectionVideosTable).values({ collectionId, videoId });
  }
  res.json({ success: true });
});

router.delete("/collections/:id/videos/:videoId", requireAuth, async (req, res): Promise<void> => {
  const collectionId = Number(req.params.id);
  const videoId = Number(req.params.videoId);
  const owned = await assertOwnsCollection(collectionId, req.user!.id);
  if (!owned) { res.status(404).json({ error: "Koleksi tidak ditemukan" }); return; }

  await db.delete(collectionVideosTable).where(
    and(eq(collectionVideosTable.collectionId, collectionId), eq(collectionVideosTable.videoId, videoId))
  );
  res.json({ success: true });
});

export default router;
