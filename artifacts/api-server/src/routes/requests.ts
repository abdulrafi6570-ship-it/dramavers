import { Router, type IRouter } from "express";
import { db, contentRequestsTable, requestVotesTable, usersTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import { CreateRequestBody } from "@workspace/api-zod";
import { z } from "zod";

const ListRequestsQueryParams = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
const VoteRequestParams = z.object({ id: z.coerce.number().int().positive() });

const router: IRouter = Router();

router.get("/requests", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 20 } = parsed.data;
  const offset = ((page as number) - 1) * (limit as number);

  const rows = await db.select({
    request: contentRequestsTable,
    username: usersTable.username,
  }).from(contentRequestsTable)
    .innerJoin(usersTable, eq(contentRequestsTable.userId, usersTable.id))
    .orderBy(desc(contentRequestsTable.votes), desc(contentRequestsTable.createdAt))
    .limit(limit as number).offset(offset);

  let votedIds = new Set<number>();
  if (req.user) {
    const votes = await db.select({ requestId: requestVotesTable.requestId })
      .from(requestVotesTable).where(eq(requestVotesTable.userId, req.user.id));
    votedIds = new Set(votes.map((v) => v.requestId));
  }

  res.json(rows.map((r) => ({
    id: r.request.id, drama: r.request.drama, actor: r.request.actor ?? null,
    scene: r.request.scene ?? null, episode: r.request.episode ?? null,
    userId: r.request.userId, username: r.username, votes: r.request.votes,
    hasVoted: req.user ? votedIds.has(r.request.id) : null,
    createdAt: r.request.createdAt.toISOString(),
  })));
});

router.post("/requests", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db.insert(contentRequestsTable).values({
    userId: req.user!.id, ...parsed.data,
  }).returning();

  res.status(201).json({
    id: request.id, drama: request.drama, actor: request.actor ?? null,
    scene: request.scene ?? null, episode: request.episode ?? null,
    userId: request.userId, username: req.user!.username, votes: request.votes,
    hasVoted: false, createdAt: request.createdAt.toISOString(),
  });
});

router.post("/requests/:id/vote", requireAuth, async (req, res): Promise<void> => {
  const params = VoteRequestParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await db.select().from(requestVotesTable).where(
    and(eq(requestVotesTable.userId, req.user!.id), eq(requestVotesTable.requestId, params.data.id))
  );

  if (existing.length === 0) {
    await db.insert(requestVotesTable).values({ userId: req.user!.id, requestId: params.data.id });
    await db.update(contentRequestsTable)
      .set({ votes: count() as any })
      .where(eq(contentRequestsTable.id, params.data.id));
    // Re-count properly
    const [{ cnt }] = await db.select({ cnt: count() }).from(requestVotesTable)
      .where(eq(requestVotesTable.requestId, params.data.id));
    await db.update(contentRequestsTable)
      .set({ votes: Number(cnt) })
      .where(eq(contentRequestsTable.id, params.data.id));
  }

  res.json({ success: true });
});

export default router;
