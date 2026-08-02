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

AUTH_ROUTE = "artifacts/api-server/src/routes/auth.ts"

replace_once(
    AUTH_ROUTE,
    'import { db, usersTable, accessCodesTable, userFollowsTable, userLoginDaysTable } from "@workspace/db";',
    'import { db, usersTable, accessCodesTable, userFollowsTable, userLoginDaysTable, videoViewsTable, dramaFavoritesTable, collectionsTable } from "@workspace/db";',
    "Import tables needed for badge calculation",
)

replace_once(
    AUTH_ROUTE,
    "  res.json({ currentStreak, longestStreak, total: dates.length, periods });\n});",
    """  res.json({ currentStreak, longestStreak, total: dates.length, periods });
});

router.get("/auth/badges", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;

  const [loginRows, [{ watchCount }], [{ favoriteCount }], [{ collectionCount }]] = await Promise.all([
    db.select({ loginDate: userLoginDaysTable.loginDate }).from(userLoginDaysTable).where(eq(userLoginDaysTable.userId, userId)).orderBy(userLoginDaysTable.loginDate),
    db.select({ watchCount: count() }).from(videoViewsTable).where(eq(videoViewsTable.userId, userId)),
    db.select({ favoriteCount: count() }).from(dramaFavoritesTable).where(eq(dramaFavoritesTable.userId, userId)),
    db.select({ collectionCount: count() }).from(collectionsTable).where(eq(collectionsTable.userId, userId)),
  ]);

  const dates = loginRows.map((r) => r.loginDate);
  let longestStreak = 0;
  let runStart: Date | null = null;
  let prevDate: Date | null = null;
  for (const dStr of dates) {
    const d = new Date(`${dStr}T00:00:00Z`);
    if (!(prevDate && d.getTime() - prevDate.getTime() === 86400000)) {
      runStart = d;
    }
    const runLen = runStart ? (d.getTime() - runStart.getTime()) / 86400000 + 1 : 1;
    if (runLen > longestStreak) longestStreak = runLen;
    prevDate = d;
  }

  const wc = Number(watchCount);
  const fc = Number(favoriteCount);
  const cc = Number(collectionCount);

  const badges = [
    { id: "streak_3", label: "3 Hari Beruntun", icon: "flame", achieved: longestStreak >= 3 },
    { id: "streak_7", label: "7 Hari Beruntun", icon: "flame", achieved: longestStreak >= 7 },
    { id: "streak_30", label: "30 Hari Beruntun", icon: "flame", achieved: longestStreak >= 30 },
    { id: "watch_10", label: "Nonton 10 Video", icon: "play", achieved: wc >= 10 },
    { id: "watch_50", label: "Nonton 50 Video", icon: "play", achieved: wc >= 50 },
    { id: "watch_100", label: "Nonton 100 Video", icon: "play", achieved: wc >= 100 },
    { id: "favorite_5", label: "5 Drama Favorit", icon: "heart", achieved: fc >= 5 },
    { id: "collector", label: "Bikin Koleksi Pertama", icon: "folder", achieved: cc >= 1 },
  ];

  res.json({ badges });
});""",
    "Add GET /auth/badges endpoint",
)

print("\nAll patches applied successfully.")
