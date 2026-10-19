def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

replace_once(
    "artifacts/api-server/src/routes/users.ts",
    """    const [[iFollow], [theyFollow]] = await Promise.all([
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, params.data.id))
      ),
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, params.data.id), eq(userFollowsTable.followingId, req.user.id))
      ),
    ]);
    isFollowing = !!iFollow;
    isFollowedByThem = !!theyFollow;""",
    """    const [[iFollow], [theyFollow]] = await Promise.all([
      db.select({ followerId: userFollowsTable.followerId }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, params.data.id))
      ),
      db.select({ followerId: userFollowsTable.followerId }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, params.data.id), eq(userFollowsTable.followingId, req.user.id))
      ),
    ]);
    isFollowing = !!iFollow;
    isFollowedByThem = !!theyFollow;""",
    "fix select kolom di GET /users/:id",
)

replace_once(
    "artifacts/api-server/src/routes/users.ts",
    """    const [[iFollow], [theyFollow]] = await Promise.all([
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, params.data.id))
      ),
      db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, params.data.id), eq(userFollowsTable.followingId, req.user.id))
      ),
    ]);
    allowed = !!(iFollow && theyFollow);""",
    """    const [[iFollow], [theyFollow]] = await Promise.all([
      db.select({ followerId: userFollowsTable.followerId }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, req.user.id), eq(userFollowsTable.followingId, params.data.id))
      ),
      db.select({ followerId: userFollowsTable.followerId }).from(userFollowsTable).where(
        and(eq(userFollowsTable.followerId, params.data.id), eq(userFollowsTable.followingId, req.user.id))
      ),
    ]);
    allowed = !!(iFollow && theyFollow);""",
    "fix select kolom di GET /users/:id/favorites",
)

print("SELESAI! Jalankan: git add -A && git commit -m 'fix: user_follows select column' && git push")
