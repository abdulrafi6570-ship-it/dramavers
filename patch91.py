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
AUTH_ROUTE = "artifacts/api-server/src/routes/auth.ts"

add_file(
    "lib/db/src/schema/user_login_days.ts",
    "patch90_user_login_days_schema.ts",
    "Add user_login_days.ts schema file",
)

replace_once(
    SCHEMA_INDEX,
    'export * from "./drama_favorites";',
    'export * from "./drama_favorites";\nexport * from "./user_login_days";',
    "Register user_login_days schema export",
)

replace_once(
    AUTH_ROUTE,
    'import { db, usersTable, accessCodesTable, userFollowsTable } from "@workspace/db";',
    'import { db, usersTable, accessCodesTable, userFollowsTable, userLoginDaysTable } from "@workspace/db";',
    "Import userLoginDaysTable into auth.ts",
)

replace_once(
    AUTH_ROUTE,
    """router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userWithCounts = await getUserWithCounts(req.user!.id);
  if (!userWithCounts) { res.status(404).json({ error: "User not found" }); return; }
  res.json(userWithCounts);
});""",
    """router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userWithCounts = await getUserWithCounts(req.user!.id);
  if (!userWithCounts) { res.status(404).json({ error: "User not found" }); return; }

  // Record today as a "logged in" day for the streak calendar — safe to
  // call repeatedly since it's a no-op after the first hit each day.
  const today = new Date().toISOString().slice(0, 10);
  await db.insert(userLoginDaysTable).values({ userId: req.user!.id, loginDate: today }).onConflictDoNothing();

  res.json(userWithCounts);
});

router.get("/auth/streak", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select({ loginDate: userLoginDaysTable.loginDate })
    .from(userLoginDaysTable)
    .where(eq(userLoginDaysTable.userId, req.user!.id))
    .orderBy(userLoginDaysTable.loginDate);

  const dates = rows.map((r) => r.loginDate);

  const periods: { periodStart: string; periodEnd: string }[] = [];
  let currentRunStart: string | null = null;
  let prevDate: Date | null = null;

  for (const dStr of dates) {
    const d = new Date(`${dStr}T00:00:00Z`);
    if (!(prevDate && d.getTime() - prevDate.getTime() === 86400000)) {
      if (currentRunStart && prevDate) {
        periods.push({ periodStart: currentRunStart, periodEnd: prevDate.toISOString().slice(0, 10) });
      }
      currentRunStart = dStr;
    }
    prevDate = d;
  }
  if (currentRunStart && prevDate) {
    periods.push({ periodStart: currentRunStart, periodEnd: prevDate.toISOString().slice(0, 10) });
  }

  let longestStreak = 0;
  for (const p of periods) {
    const len = (new Date(`${p.periodEnd}T00:00:00Z`).getTime() - new Date(`${p.periodStart}T00:00:00Z`).getTime()) / 86400000 + 1;
    if (len > longestStreak) longestStreak = len;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let currentStreak = 0;
  const lastPeriod = periods[periods.length - 1];
  if (lastPeriod && (lastPeriod.periodEnd === todayStr || lastPeriod.periodEnd === yesterdayStr)) {
    currentStreak = (new Date(`${lastPeriod.periodEnd}T00:00:00Z`).getTime() - new Date(`${lastPeriod.periodStart}T00:00:00Z`).getTime()) / 86400000 + 1;
  }

  res.json({ currentStreak, longestStreak, total: dates.length, periods });
});""",
    "Record daily login + add GET /auth/streak endpoint",
)

print("\nAll patches applied successfully.")
