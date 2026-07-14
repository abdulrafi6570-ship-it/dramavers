import { Router, type IRouter } from "express";
import { db, usersTable, userFollowsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();
const UserIdParam = z.object({ id: z.coerce.number().int().positive() });

router.get("/users/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [dbUser] = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    photoUrl: usersTable.photoUrl,
    bio: usersTable.bio,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, params.data.id));

  if (!dbUser) { res.status(404).json({ error: "User not found" }); return; }

  const [[{ followerCount }], [{ followingCount }]] = await Promise.all([
    db.select({ followerCount: count() }).from(userFollowsTable).where(eq(userFollowsTable.followingId, params.data.id)),
    db.select({ followingCount: count() }).from(userFollowsTable).where(eq(userFollowsTable.followerId, params.data.id)),
  ]);

  let isFollowing = false;
  if (req.user) {
    const [existing] = await db.select().from(userFollowsTable).where(
      and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, params.data.id))
    );
    isFollowing = !!existing;
  }

  res.json({
    id: dbUser.id,
    username: dbUser.username,
    photoUrl: dbUser.photoUrl ?? null,
    bio: dbUser.bio ?? null,
    role: dbUser.role,
    createdAt: dbUser.createdAt.toISOString(),
    followerCount: Number(followerCount),
    followingCount: Number(followingCount),
    isFollowing,
  });
});

router.post("/users/:id/follow", requireAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (params.data.id === req.user!.id) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  const [target] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  await db.insert(userFollowsTable).values({
    followerId: req.user!.id,
    followingId: params.data.id,
  }).onConflictDoNothing();

  res.json({ success: true });
});

router.delete("/users/:id/follow", requireAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(userFollowsTable).where(
    and(eq(userFollowsTable.followerId, req.user!.id), eq(userFollowsTable.followingId, params.data.id))
  );

  res.json({ success: true });
});

router.get("/users/:id/following", optionalAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const following = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    photoUrl: usersTable.photoUrl,
  }).from(userFollowsTable)
    .innerJoin(usersTable, eq(userFollowsTable.followingId, usersTable.id))
    .where(eq(userFollowsTable.followerId, params.data.id));

  res.json(following.map(u => ({ ...u, photoUrl: u.photoUrl ?? null })));
});

router.get("/users/:id/followers", optionalAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const followers = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    photoUrl: usersTable.photoUrl,
  }).from(userFollowsTable)
    .innerJoin(usersTable, eq(userFollowsTable.followerId, usersTable.id))
    .where(eq(userFollowsTable.followingId, params.data.id));

  res.json(followers.map(u => ({ ...u, photoUrl: u.photoUrl ?? null })));
});

export default router;
