import { Router, type IRouter } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, usersTable, accessCodesTable, userFollowsTable, userLoginDaysTable, videoViewsTable, dramaFavoritesTable, collectionsTable } from "@workspace/db";
import { eq, and, or, gt, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { RegisterBody, LoginBody, VerifyAccessCodeBody } from "@workspace/api-zod";
import { z } from "zod";
import { supabaseAdmin, supabaseAnon } from "../lib/supabase";
import { assertR2Configured, uploadToR2, buildR2Key } from "../lib/r2";

const router: IRouter = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

async function getUserWithCounts(userId: number) {
  const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!dbUser) return null;
  const [[{ followerCount }], [{ followingCount }]] = await Promise.all([
    db.select({ followerCount: count() }).from(userFollowsTable).where(eq(userFollowsTable.followingId, userId)),
    db.select({ followingCount: count() }).from(userFollowsTable).where(eq(userFollowsTable.followerId, userId)),
  ]);
  return {
    id: dbUser.id,
    username: dbUser.username,
    role: dbUser.role,
    verified: dbUser.verified,
    photoUrl: dbUser.photoUrl ?? null,
    bio: dbUser.bio ?? null,
    isPrivate: dbUser.isPrivate ?? false,
    createdAt: dbUser.createdAt.toISOString(),
    followerCount: Number(followerCount),
    followingCount: Number(followingCount),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { username, password } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) { res.status(400).json({ error: "Username already taken" }); return; }

  const email = `${username.toLowerCase()}@twixtor.app`;

  const { data: supaData, error: supaError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (supaError || !supaData.user) {
    res.status(400).json({ error: supaError?.message ?? "Registration failed" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    supabaseId: supaData.user.id,
    username,
    passwordHash: "",
    role: "user",
    verified: false,
  }).returning();

  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (signInError || !signInData.session) {
    res.status(500).json({ error: "Account created but could not create session" });
    return;
  }

  res.status(201).json({
    user: { id: user.id, username: user.username, role: user.role, verified: user.verified, photoUrl: null, bio: null, createdAt: user.createdAt.toISOString(), followerCount: 0, followingCount: 0 },
    token: signInData.session.access_token,
    refreshToken: signInData.session.refresh_token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { username, password } = parsed.data;

  const email = `${username.toLowerCase()}@twixtor.app`;

  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (signInError || !signInData.session) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.supabaseId, signInData.user.id));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const userWithCounts = await getUserWithCounts(user.id);
  res.json({ user: userWithCounts, token: signInData.session.access_token, refreshToken: signInData.session.refresh_token });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : null;
  if (!refreshToken) { res.status(400).json({ error: "Missing refresh token" }); return; }

  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token });
});

router.post("/auth/change-credentials", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const ChangeBody = z.object({
    newUsername: z.string().min(3).max(30).optional(),
    newPassword: z.string().min(6).max(100).optional(),
  });
  const parsed = ChangeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { newUsername, newPassword } = parsed.data;
  if (!newUsername && !newPassword) { res.status(400).json({ error: "Nothing to update" }); return; }

  const [adminUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!adminUser || !adminUser.supabaseId) { res.status(400).json({ error: "Admin account not linked to auth" }); return; }

  const updates: Record<string, string> = {};
  if (newPassword) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(adminUser.supabaseId, { password: newPassword });
    if (error) { res.status(400).json({ error: error.message }); return; }
    const hash = await (await import("bcryptjs")).hash(newPassword, 12);
    updates.passwordHash = hash;
  }
  if (newUsername && newUsername !== adminUser.username) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, newUsername));
    if (existing) { res.status(400).json({ error: "Username sudah dipakai" }); return; }
    const newEmail = `${newUsername.toLowerCase()}@twixtor.app`;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(adminUser.supabaseId, { email: newEmail });
    if (error) { res.status(400).json({ error: error.message }); return; }
    updates.username = newUsername;
  }
  if (Object.keys(updates).length > 0) {
    await db.update(usersTable).set(updates as any).where(eq(usersTable.id, req.user!.id));
  }
  res.json({ success: true, username: newUsername ?? adminUser.username });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
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
});

router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const UpdateProfileBody = z.object({
    bio: z.string().max(300).optional(),
    photoUrl: z.string().optional(),
    isPrivate: z.boolean().optional(),
  });
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, string | null | boolean> = {};
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio || null;
  if (parsed.data.photoUrl !== undefined) updates.photoUrl = parsed.data.photoUrl || null;
  if (parsed.data.isPrivate !== undefined) updates.isPrivate = parsed.data.isPrivate;
  await db.update(usersTable).set(updates as any).where(eq(usersTable.id, req.user!.id));
  const userWithCounts = await getUserWithCounts(req.user!.id);
  res.json(userWithCounts);
});

router.post("/auth/upload-photo", requireAuth, avatarUpload.single("photo"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  try {
    assertR2Configured();
  } catch (err: any) {
    res.status(503).json({ error: `Storage not configured: ${err.message}` });
    return;
  }
  let photoUrl: string;
  try {
    const r2Key = buildR2Key("images", `avatar_${randomUUID()}.jpg`);
    photoUrl = await uploadToR2(r2Key, req.file.buffer, req.file.mimetype);
  } catch (err: any) {
    req.log.error({ err }, "[UploadPhoto] R2 upload failed");
    res.status(502).json({ error: "Upload foto ke storage gagal" });
    return;
  }
  await db.update(usersTable).set({ photoUrl }).where(eq(usersTable.id, req.user!.id));
  const userWithCounts = await getUserWithCounts(req.user!.id);
  res.json({ photoUrl, user: userWithCounts });
});

router.post("/auth/verify-code", requireAuth, async (req, res): Promise<void> => {
  const parsed = VerifyAccessCodeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { code } = parsed.data;
  const now = new Date();
  const [accessCode] = await db.select().from(accessCodesTable).where(
    and(
      eq(accessCodesTable.code, code),
      eq(accessCodesTable.active, true),
      or(eq(accessCodesTable.expiredAt, null as any), gt(accessCodesTable.expiredAt, now))
    )
  );
  if (!accessCode) { res.status(400).json({ error: "Invalid or expired code" }); return; }
  await db.update(usersTable).set({ verified: true }).where(eq(usersTable.id, req.user!.id));
  const userWithCounts = await getUserWithCounts(req.user!.id);
  res.json(userWithCounts);
});

export default router;
