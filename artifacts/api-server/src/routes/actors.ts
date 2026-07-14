import { Router, type IRouter } from "express";
import { db, actorsTable, dramasTable, dramaActorsTable, videosTable, followsTable } from "@workspace/db";
import { eq, ilike, and, count } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth";
import {
  ListActorsQueryParams,
  CreateActorBody,
  GetActorParams,
  UpdateActorParams,
  UpdateActorBody,
  DeleteActorParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/actors", async (req, res): Promise<void> => {
  const parsed = ListActorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, dramaId, type: actorType, page = 1, limit = 20 } = parsed.data as any;

  const conditions: any[] = [];
  if (actorType) conditions.push(eq(actorsTable.type, actorType));
  if (search) conditions.push(ilike(actorsTable.name, `%${search}%`));

  let query = db.select({ actor: actorsTable }).from(actorsTable) as any;

  if (dramaId) {
    query = db
      .select({ actor: actorsTable })
      .from(dramaActorsTable)
      .innerJoin(actorsTable, eq(dramaActorsTable.actorId, actorsTable.id))
      .where(eq(dramaActorsTable.dramaId, dramaId as number));
  } else if (conditions.length > 0) {
    const { and: andFn } = await import("drizzle-orm");
    query = db.select({ actor: actorsTable }).from(actorsTable).where(andFn(...conditions));
  }

  const offset = ((page as number) - 1) * (limit as number);
  const actors = await query.limit(limit).offset(offset);

  const whereTotal = conditions.length > 0 ? (await import("drizzle-orm")).and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(actorsTable).where(whereTotal);

  const result = await Promise.all(actors.map(async (r: any) => {
    const actor = r.actor || r;
    const [{ vc }] = await db.select({ vc: count() }).from(videosTable).where(
      and(eq(videosTable.actorId, actor.id), eq(videosTable.status, "published"))
    );
    const [{ fc }] = await db.select({ fc: count() }).from(followsTable).where(eq(followsTable.actorId, actor.id));
    return {
      id: actor.id,
      name: actor.name,
      photoUrl: actor.photoUrl ?? null,
      type: actor.type,
      videoCount: Number(vc),
      followerCount: Number(fc),
      createdAt: actor.createdAt.toISOString(),
    };
  }));

  res.json({ actors: result, total: Number(total), page: page as number, limit: limit as number });
});

router.post("/actors", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateActorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [actor] = await db.insert(actorsTable).values(parsed.data).returning();
  res.status(201).json({ ...actor, photoUrl: actor.photoUrl ?? null, videoCount: 0, followerCount: 0, createdAt: actor.createdAt.toISOString() });
});

router.get("/actors/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetActorParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const [actor] = await db.select().from(actorsTable).where(eq(actorsTable.id, id));
  if (!actor) {
    res.status(404).json({ error: "Actor not found" });
    return;
  }

  const dramaRows = await db
    .select({ drama: dramasTable })
    .from(dramaActorsTable)
    .innerJoin(dramasTable, eq(dramaActorsTable.dramaId, dramasTable.id))
    .where(eq(dramaActorsTable.actorId, id));

  const videos = await db.select().from(videosTable).where(
    and(eq(videosTable.actorId, id), eq(videosTable.status, "published"))
  ).orderBy(videosTable.createdAt);

  const [{ followerCount }] = await db.select({ followerCount: count() }).from(followsTable).where(eq(followsTable.actorId, id));

  let isFollowed = false;
  if (req.user) {
    const [existing] = await db.select().from(followsTable).where(
      and(eq(followsTable.userId, req.user.id), eq(followsTable.actorId, id))
    );
    isFollowed = !!existing;
  }

  const dramas = dramaRows.map((r) => ({
    ...r.drama,
    posterUrl: r.drama.posterUrl ?? null,
    description: r.drama.description ?? null,
    genre: r.drama.genre ?? null,
    videoCount: null,
    createdAt: r.drama.createdAt.toISOString(),
  }));

  res.json({
    id: actor.id,
    name: actor.name,
    photoUrl: actor.photoUrl ?? null,
    dramas,
    videos: videos.map(formatVideo),
    videoCount: videos.length,
    followerCount: Number(followerCount),
    isFollowed,
    createdAt: actor.createdAt.toISOString(),
  });
});

router.patch("/actors/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateActorParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateActorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [actor] = await db.update(actorsTable).set(parsed.data).where(eq(actorsTable.id, params.data.id)).returning();
  if (!actor) {
    res.status(404).json({ error: "Actor not found" });
    return;
  }
  res.json({ ...actor, photoUrl: actor.photoUrl ?? null, videoCount: null, followerCount: null, createdAt: actor.createdAt.toISOString() });
});

router.delete("/actors/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteActorParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(actorsTable).where(eq(actorsTable.id, params.data.id));
  res.sendStatus(204);
});

function formatVideo(v: any) {
  return {
    id: v.id, title: v.title, dramaId: v.dramaId ?? null, actorId: v.actorId ?? null,
    dramaName: null, actorName: null, episode: v.episode ?? null, scene: v.scene ?? null,
    videoUrl: v.videoUrl ?? null, thumbnailUrl: v.thumbnailUrl ?? null, type: v.type, status: v.status,
    resolution: v.resolution ?? null, fps: v.fps ?? null, duration: v.duration ?? null,
    fileSize: v.fileSize ?? null, format: v.format ?? null, tags: v.tags ?? [], viewCount: v.viewCount ?? 0,
    downloadCount: v.downloadCount ?? 0, favoriteCount: v.favoriteCount ?? 0,
    popularityScore: v.popularityScore ?? null, isFavorited: null, isBookmarked: null,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  };
}

export default router;
