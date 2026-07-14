import { Router, type IRouter } from "express";
import { db, followsTable, actorsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/follows/actors/:id", requireAuth, async (req, res): Promise<void> => {
  const actorId = Number(req.params.id);
  const userId = req.user!.id;

  if (isNaN(actorId)) {
    res.status(400).json({ error: "Invalid actor id" });
    return;
  }

  const [actor] = await db.select().from(actorsTable).where(eq(actorsTable.id, actorId));
  if (!actor) {
    res.status(404).json({ error: "Actor not found" });
    return;
  }

  const [existing] = await db.select().from(followsTable).where(
    and(eq(followsTable.userId, userId), eq(followsTable.actorId, actorId))
  );

  if (!existing) {
    await db.insert(followsTable).values({ userId, actorId });
  }

  const [{ total }] = await db.select({ total: count() }).from(followsTable).where(eq(followsTable.actorId, actorId));

  res.json({ isFollowed: true, followerCount: Number(total) });
});

router.delete("/follows/actors/:id", requireAuth, async (req, res): Promise<void> => {
  const actorId = Number(req.params.id);
  const userId = req.user!.id;

  if (isNaN(actorId)) {
    res.status(400).json({ error: "Invalid actor id" });
    return;
  }

  await db.delete(followsTable).where(
    and(eq(followsTable.userId, userId), eq(followsTable.actorId, actorId))
  );

  const [{ total }] = await db.select({ total: count() }).from(followsTable).where(eq(followsTable.actorId, actorId));

  res.json({ isFollowed: false, followerCount: Number(total) });
});

router.get("/follows/actors", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const rows = await db
    .select({ actor: actorsTable })
    .from(followsTable)
    .innerJoin(actorsTable, eq(followsTable.actorId, actorsTable.id))
    .where(eq(followsTable.userId, userId));

  res.json(rows.map((r) => ({
    id: r.actor.id,
    name: r.actor.name,
    photoUrl: r.actor.photoUrl ?? null,
    type: r.actor.type,
    createdAt: r.actor.createdAt.toISOString(),
  })));
});

export default router;
