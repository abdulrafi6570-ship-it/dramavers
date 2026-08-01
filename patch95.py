import sys

def replace_once(path, old, new, label):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        print(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
        sys.exit(1)
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

USERS_PATH = "artifacts/api-server/src/routes/users.ts"

replace_once(
    USERS_PATH,
    'import { db, usersTable, userFollowsTable, favoritesTable, videosTable, dramasTable } from "@workspace/db";',
    'import { db, usersTable, userFollowsTable, favoritesTable, videosTable, dramasTable, dramaFavoritesTable } from "@workspace/db";',
    "Import dramaFavoritesTable into users.ts",
)

replace_once(
    USERS_PATH,
    """  const rows = await db.select({
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
});""",
    """  const rows = await db.select({
    id: dramasTable.id,
    name: dramasTable.name,
    posterUrl: dramasTable.posterUrl,
    category: dramasTable.category,
  }).from(dramaFavoritesTable)
    .innerJoin(dramasTable, eq(dramaFavoritesTable.dramaId, dramasTable.id))
    .where(eq(dramaFavoritesTable.userId, params.data.id));

  const dramas = rows.map((r) => ({ id: r.id, name: r.name, posterUrl: r.posterUrl ?? null, category: r.category }));

  res.json(dramas);
});""",
    "Use dramaFavoritesTable directly instead of deriving from old video favorites",
)

print("\nAll patches applied successfully.")
