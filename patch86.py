import sys, os, shutil

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

def add_file(dest, source, label):
    if os.path.exists(dest):
        print(f"[FAIL] {label}: {dest} already exists — refusing to overwrite")
        sys.exit(1)
    if not os.path.exists(source):
        print(f"[FAIL] {label}: source file {source} not found next to this script")
        sys.exit(1)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy(source, dest)
    print(f"[OK] {label}")

SCHEMA_INDEX = "lib/db/src/schema/index.ts"
ROUTES_INDEX = "artifacts/api-server/src/routes/index.ts"
DRAMAS_ROUTE = "artifacts/api-server/src/routes/dramas.ts"

add_file(
    "lib/db/src/schema/drama_favorites.ts",
    "patch86_drama_favorites_schema.ts",
    "Add drama_favorites.ts schema file",
)

replace_once(
    SCHEMA_INDEX,
    'export * from "./favorites";',
    'export * from "./favorites";\nexport * from "./drama_favorites";',
    "Register drama_favorites schema export",
)

add_file(
    "artifacts/api-server/src/routes/drama-favorites.ts",
    "patch86_drama_favorites_route.ts",
    "Add drama-favorites.ts route file",
)

replace_once(
    ROUTES_INDEX,
    'import favoritesRouter from "./favorites";',
    'import favoritesRouter from "./favorites";\nimport dramaFavoritesRouter from "./drama-favorites";',
    "Import dramaFavoritesRouter",
)

replace_once(
    ROUTES_INDEX,
    "router.use(favoritesRouter);",
    "router.use(favoritesRouter);\nrouter.use(dramaFavoritesRouter);",
    "Register dramaFavoritesRouter",
)

replace_once(
    DRAMAS_ROUTE,
    'import { requireAuth, requireAdmin } from "../middlewares/auth";',
    'import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth";\nimport { db as dbForFav, dramaFavoritesTable } from "@workspace/db";\nimport { eq as eqFav, and as andFav } from "drizzle-orm";',
    "Import optionalAuth + drama favorites table for isFavorited flag",
)

replace_once(
    DRAMAS_ROUTE,
    'router.get("/dramas/:id", async (req, res): Promise<void> => {',
    'router.get("/dramas/:id", optionalAuth, async (req, res): Promise<void> => {',
    "Add optionalAuth middleware to drama detail route",
)

replace_once(
    DRAMAS_ROUTE,
    """  const actors = actorRows.map((r) => ({
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
});""",
    """  const actors = actorRows.map((r) => ({
    ...r.actor,
    photoUrl: r.actor.photoUrl ?? null,
    videoCount: 0,
    createdAt: r.actor.createdAt.toISOString(),
  }));

  let isFavorited = false;
  if (req.user) {
    const [fav] = await dbForFav.select().from(dramaFavoritesTable).where(
      andFav(eqFav(dramaFavoritesTable.userId, req.user.id), eqFav(dramaFavoritesTable.dramaId, id))
    );
    isFavorited = !!fav;
  }

  res.json({
    ...drama,
    posterUrl: drama.posterUrl ?? null,
    description: drama.description ?? null,
    genre: drama.genre ?? null,
    actors,
    videos: videos.map((v) => formatVideo(v)),
    videoCount: videos.length,
    isFavorited,
    createdAt: drama.createdAt.toISOString(),
  });
});""",
    "Include isFavorited flag in drama detail response",
)

print("\nAll patches applied successfully.")
