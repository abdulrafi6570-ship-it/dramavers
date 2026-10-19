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

path = "artifacts/api-server/src/routes/users.ts"

old_dup = '''router.post("/users/:id/follow", requireAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  if (req.user!.id === params.data.id) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  const [target] = await db.select({ followerId: usersTable.id }).from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  await db.insert(userFollowsTable).values({
    followerId: req.user!.id,
    followingId: params.data.id,
  }).onConflictDoNothing();

  res.json({ ok: true });
});

router.delete("/users/:id/follow", requireAuth, async (req, res): Promise<void> => {
  const params = UserIdParam.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(userFollowsTable).where(
    and(eq(userFollowsTable.followerId, req.user!.id), eq(userFollowsTable.followingId, params.data.id))
  );

  res.json({ ok: true });
});

router.get("/users/:id/favorites"'''

new_clean = 'router.get("/users/:id/favorites"'

replace_once(path, old_dup, new_clean, "hapus route follow/unfollow duplikat")
print("\nSelesai! Route follow duplikat udah dibersihin.")
