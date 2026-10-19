def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

ROUTES_INDEX = "artifacts/api-server/src/routes/index.ts"

replace_once(
    ROUTES_INDEX,
    'import followsRouter from "./follows";\n',
    '',
    "hapus import followsRouter",
)

replace_once(
    ROUTES_INDEX,
    'router.use(followsRouter);\n',
    '',
    "matiin endpoint /follows/actors/* (penyebab crash)",
)

ACTORS_ROUTE = "artifacts/api-server/src/routes/actors.ts"

replace_once(
    ACTORS_ROUTE,
    '''  const [{ followerCount }] = await db.select({ followerCount: count() }).from(followsTable).where(eq(followsTable.actorId, id));

  let isFollowed = false;
  if (req.user) {
    const [existing] = await db.select().from(followsTable).where(
      and(eq(followsTable.userId, req.user.id), eq(followsTable.actorId, id))
    );
    isFollowed = !!existing;
  }

  const dramas = dramaRows.map((r) => ({''',
    '''  const dramas = dramaRows.map((r) => ({''',
    "hapus query follow (followerCount/isFollowed) dari GET /actors/:id",
)

replace_once(
    ACTORS_ROUTE,
    '''    videoCount: videos.length,
    followerCount: Number(followerCount),
    isFollowed,
    createdAt: actor.createdAt.toISOString(),''',
    '''    videoCount: videos.length,
    createdAt: actor.createdAt.toISOString(),''',
    "hapus followerCount/isFollowed dari response GET /actors/:id",
)

print("\nSelesai patch70: fitur follow aktor dimatiin di backend, halaman aktor gak crash lagi.")
