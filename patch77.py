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

HOME_PATH = "artifacts/api-server/src/routes/home.ts"

replace_once(
    HOME_PATH,
    'import { eq, ilike, desc, count } from "drizzle-orm";',
    'import { eq, ilike, desc, count, gt, and } from "drizzle-orm";',
    "Import gt and and from drizzle-orm",
)

replace_once(
    HOME_PATH,
    """    db.select({ video: videosTable, dramaName: dramasTable.name, actorName: actorsTable.name })
      .from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(eq(videosTable.status, "published"))
      .orderBy(desc(videosTable.viewCount), desc(videosTable.popularityScore), desc(videosTable.downloadCount)).limit(12),""",
    """    db.select({ video: videosTable, dramaName: dramasTable.name, actorName: actorsTable.name })
      .from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(and(eq(videosTable.status, "published"), gt(videosTable.viewCount, 0)))
      .orderBy(desc(videosTable.viewCount), desc(videosTable.popularityScore), desc(videosTable.downloadCount)).limit(12),""",
    "Filter out 0-view videos from Popular Clips query",
)

print("\nAll patches applied successfully.")
