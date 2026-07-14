import { Router, type IRouter } from "express";
import { db, dramasTable, actorsTable, dramaActorsTable, videosTable } from "@workspace/db";
import { eq, ilike, and, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  ListDramasQueryParams,
  CreateDramaBody,
  GetDramaParams,
  UpdateDramaParams,
  UpdateDramaBody,
  DeleteDramaParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dramas", async (req, res): Promise<void> => {
  const parsed = ListDramasQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, genre, search, page = 1, limit = 20 } = parsed.data;

  const conditions: any[] = [];
  if (category) conditions.push(eq(dramasTable.category, category as any));
  if (genre) conditions.push(ilike(dramasTable.genre, `%${genre}%`));
  if (search) conditions.push(ilike(dramasTable.name, `%${search}%`));

  const offset = ((page as number) - 1) * (limit as number);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [dramas, [{ total }]] = await Promise.all([
    db.select().from(dramasTable).where(whereClause).limit(limit as number).offset(offset).orderBy(dramasTable.createdAt),
    db.select({ total: count() }).from(dramasTable).where(whereClause),
  ]);

  const dramasWithCount = await Promise.all(dramas.map(async (drama) => {
    const [{ vc }] = await db.select({ vc: count() }).from(videosTable).where(
      and(eq(videosTable.dramaId, drama.id), eq(videosTable.status, "published"))
    );
    return {
      ...drama,
      videoCount: Number(vc),
      posterUrl: drama.posterUrl ?? null,
      description: drama.description ?? null,
      genre: drama.genre ?? null,
      createdAt: drama.createdAt.toISOString(),
    };
  }));

  res.json({ dramas: dramasWithCount, total: Number(total), page: page as number, limit: limit as number });
});

router.post("/dramas", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateDramaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [drama] = await db.insert(dramasTable).values(parsed.data as any).returning();
  res.status(201).json({ ...drama, createdAt: drama.createdAt.toISOString() });
});

router.get("/dramas/:id", async (req, res): Promise<void> => {
  const params = GetDramaParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, id));
  if (!drama) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  const actorRows = await db
    .select({ actor: actorsTable })
    .from(dramaActorsTable)
    .innerJoin(actorsTable, eq(dramaActorsTable.actorId, actorsTable.id))
    .where(eq(dramaActorsTable.dramaId, id));

  const videos = await db.select().from(videosTable).where(
    and(eq(videosTable.dramaId, id), eq(videosTable.status, "published"))
  ).orderBy(videosTable.createdAt);

  const actors = actorRows.map((r) => ({
    ...r.actor,
    photoUrl: r.actor.photoUrl ?? null,
    videoCount: 0,
    createdAt: r.actor.createdAt.toISOString(),
  }));

  res.json({
    ...drama,
    posterUrl: drama.posterUrl ?? null,
    description: drama.description ?? null,
    genre: drama.genre ?? null,
    actors,
    videos: videos.map((v) => formatVideo(v)),
    videoCount: videos.length,
    createdAt: drama.createdAt.toISOString(),
  });
});

router.patch("/dramas/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateDramaParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDramaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [drama] = await db.update(dramasTable).set(parsed.data as any).where(eq(dramasTable.id, params.data.id)).returning();
  if (!drama) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }
  res.json({ ...drama, createdAt: drama.createdAt.toISOString() });
});

router.delete("/dramas/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteDramaParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(dramasTable).where(eq(dramasTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/dramas/:id/actors", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const rows = await db.select({ actor: actorsTable })
    .from(dramaActorsTable)
    .innerJoin(actorsTable, eq(dramaActorsTable.actorId, actorsTable.id))
    .where(eq(dramaActorsTable.dramaId, id));
  res.json(rows.map((r) => ({ ...r.actor, photoUrl: r.actor.photoUrl ?? null, createdAt: r.actor.createdAt.toISOString() })));
});

router.post("/dramas/:id/actors", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const dramaId = Number(req.params.id);
  const { actorId } = req.body;
  if (!actorId) { res.status(400).json({ error: "actorId required" }); return; }
  const existing = await db.select().from(dramaActorsTable).where(
    and(eq(dramaActorsTable.dramaId, dramaId), eq(dramaActorsTable.actorId, Number(actorId)))
  );
  if (existing.length === 0) {
    await db.insert(dramaActorsTable).values({ dramaId, actorId: Number(actorId) });
  }
  res.json({ success: true });
});

router.delete("/dramas/:id/actors/:actorId", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const dramaId = Number(req.params.id);
  const actorId = Number(req.params.actorId);
  await db.delete(dramaActorsTable).where(
    and(eq(dramaActorsTable.dramaId, dramaId), eq(dramaActorsTable.actorId, actorId))
  );
  res.json({ success: true });
});

function formatVideo(v: any) {
  return {
    id: v.id,
    title: v.title,
    dramaId: v.dramaId ?? null,
    actorId: v.actorId ?? null,
    dramaName: null,
    actorName: null,
    episode: v.episode ?? null,
    scene: v.scene ?? null,
    videoUrl: v.videoUrl ?? null,
    thumbnailUrl: v.thumbnailUrl ?? null,
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
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  };
}

export default router;
