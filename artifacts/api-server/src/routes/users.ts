import { Router, type IRouter } from "express";
import { db, usersTable, userFollowsTable, favoritesTable, videosTable, dramasTable } from "@workspace/db";
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
    isPrivate: usersTable.isPrivate,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, params.data.id));

  if (!dbUser) { res.status(404).json({ error: "User not found" }); return; }

  const [[{ followerCount }], [{ followingCount }]] = await Promise.all([
    db.select({ followerCount: count() }).from(userFollowsTable).where(eq(userFollowsTable.followingId, params.data.id)),
    db.select({ followingCount: count() }).from(userFollowsTable).where(eq(userFollowsTable.followerId, params.data.id)),
  ]);

  let isFollowing = false;
  let isFollowedByThem = false;
  if (req.user) {
    const [[iFollow], [theyFollow]] = await Promise.all([
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, params.data.id))
      ),
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, params.data.id), eq(userFollowsTable.followingId, req.user.id))
      ),
    ]);
    isFollowing = !!iFollow;
    isFollowedByThem = !!theyFollow;
  }

  const isFriend = isFollowing && isFollowedByThem;

  res.json({
    id: dbUser.id,
    username: dbUser.username,
    photoUrl: dbUser.photoUrl ?? null,
    bio: dbUser.bio ?? null,
    role: dbUser.role,
    isPrivate: dbUser.isPrivate,
    createdAt: dbUser.createdAt.toISOString(),
    followerCount: Number(followerCount),
    followingCount: Number(followingCount),
    isFollowing,
    isFollowedByThem,
    isFriend,
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

router.get("/users/:id/favorites", optionalAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [targetUser] = await db.select({
    id: usersTable.id,
    isPrivate: usersTable.isPrivate,
  }).from(usersTable).where(eq(usersTable.id, params.data.id));

  if (!targetUser) { res.status(404).json({ error: "User not found" }); return; }

  let allowed = req.user?.id === params.data.id;
  if (!allowed) allowed = !targetUser.isPrivate;
  if (!allowed && req.user) {
    const [[iFollow], [theyFollow]] = await Promise.all([
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, params.data.id))
      ),
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, params.data.id), eq(userFollowsTable.followingId, req.user.id))
      ),
    ]);
    allowed = !!(iFollow && theyFollow);
  }

  if (!allowed) { res.status(403).json({ error: "Akun ini privat" }); return; }

  const rows = await db.select({
    id: dramasTable.id,
    name: dramasTable.name,
    posterUrl: dramasTable.posterUrl,
    category: dramasTable.category,
  }).from(favoritesTable)
    .innerJoin(videosTable, eq(favoritesTable.videoId, videosTable.id))
    .innerJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .where(eq(favoritesTable.userId, params.data.id));

  const seen = new Set<number>();
  const dramas = rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).map((r) => ({ id: r.id, name: r.name, posterUrl: r.posterUrl ?? null, category: r.category }));

  res.json(dramas);
});

export default router;
