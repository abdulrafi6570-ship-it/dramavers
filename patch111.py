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

ADMIN_ROUTE = "artifacts/api-server/src/routes/admin.ts"

replace_once(
    ADMIN_ROUTE,
    'import { db, usersTable, videosTable, dramasTable, actorsTable, downloadsTable, favoritesTable, accessCodesTable } from "@workspace/db";\nimport { eq, and, desc, count, gt } from "drizzle-orm";',
    'import { db, usersTable, videosTable, dramasTable, actorsTable, downloadsTable, favoritesTable, accessCodesTable, videoViewsTable, dramaFavoritesTable } from "@workspace/db";\nimport { eq, and, desc, count, gt, sql } from "drizzle-orm";',
    "Import extra tables + sql helper into admin.ts",
)

replace_once(
    ADMIN_ROUTE,
    'router.get("/admin/access-codes", requireAuth, requireAdmin, async (_req, res): Promise<void> => {',
    """router.get("/admin/analytics", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const [viewsPerDayRows, viewsByHourRows, topVideos, topDramasRows] = await Promise.all([
    db.select({
      day: sql<string>`to_char(${videoViewsTable.viewedAt}, 'YYYY-MM-DD')`,
      cnt: count(),
    }).from(videoViewsTable)
      .where(sql`${videoViewsTable.viewedAt} > now() - interval '30 days'`)
      .groupBy(sql`to_char(${videoViewsTable.viewedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${videoViewsTable.viewedAt}, 'YYYY-MM-DD')`),

    db.select({
      hour: sql<number>`extract(hour from ${videoViewsTable.viewedAt})::int`,
      cnt: count(),
    }).from(videoViewsTable)
      .groupBy(sql`extract(hour from ${videoViewsTable.viewedAt})`)
      .orderBy(sql`extract(hour from ${videoViewsTable.viewedAt})`),

    db.select({ id: videosTable.id, title: videosTable.title, viewCount: videosTable.viewCount, thumbnailUrl: videosTable.thumbnailUrl })
      .from(videosTable)
      .orderBy(desc(videosTable.viewCount))
      .limit(10),

    db.select({
      id: dramasTable.id, name: dramasTable.name, posterUrl: dramasTable.posterUrl, cnt: count(),
    }).from(dramaFavoritesTable)
      .innerJoin(dramasTable, eq(dramaFavoritesTable.dramaId, dramasTable.id))
      .groupBy(dramasTable.id, dramasTable.name, dramasTable.posterUrl)
      .orderBy(desc(count()))
      .limit(10),
  ]);

  res.json({
    viewsPerDay: viewsPerDayRows.map((r) => ({ date: r.day, count: Number(r.cnt) })),
    viewsByHour: viewsByHourRows.map((r) => ({ hour: Number(r.hour), count: Number(r.cnt) })),
    topVideos: topVideos.map((v) => ({ id: v.id, title: v.title, viewCount: v.viewCount ?? 0, thumbnailUrl: v.thumbnailUrl ?? null })),
    topDramas: topDramasRows.map((r) => ({ id: r.id, name: r.name, posterUrl: r.posterUrl ?? null, favoriteCount: Number(r.cnt) })),
  });
});

router.get("/admin/access-codes", requireAuth, requireAdmin, async (_req, res): Promise<void> => {""",
    "Add GET /admin/analytics endpoint",
)

print("\nAll patches applied successfully.")
