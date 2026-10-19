import { Router, type IRouter } from "express";
import { db, userLoginDaysTable, usersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (_req, res): Promise<void> => {
  const rows = await db.select({
    userId: userLoginDaysTable.userId,
    loginDate: userLoginDaysTable.loginDate,
  }).from(userLoginDaysTable).orderBy(userLoginDaysTable.userId, userLoginDaysTable.loginDate);

  const byUser = new Map<number, string[]>();
  for (const r of rows) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, []);
    byUser.get(r.userId)!.push(r.loginDate);
  }

  const entries: { userId: number; longestStreak: number; totalDays: number }[] = [];
  for (const [userId, dates] of byUser) {
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
    entries.push({ userId, longestStreak, totalDays: dates.length });
  }

  entries.sort((a, b) => b.longestStreak - a.longestStreak || b.totalDays - a.totalDays);
  const top = entries.slice(0, 20);

  const userIds = top.map((e) => e.userId);
  const userRows = userIds.length > 0
    ? await db.select({ id: usersTable.id, username: usersTable.username, photoUrl: usersTable.photoUrl })
        .from(usersTable)
        .where(inArray(usersTable.id, userIds))
    : [];
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  const leaderboard = top
    .filter((e) => userMap.has(e.userId))
    .map((e, i) => {
      const u = userMap.get(e.userId)!;
      return {
        rank: i + 1,
        userId: u.id,
        username: u.username,
        photoUrl: u.photoUrl ?? null,
        longestStreak: e.longestStreak,
        totalDays: e.totalDays,
      };
    });

  res.json({ leaderboard });
});

export default router;
