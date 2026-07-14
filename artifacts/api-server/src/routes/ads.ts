import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { adsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/ads/active", async (_req, res): Promise<void> => {
  const ads = await db.select().from(adsTable).where(eq(adsTable.active, true)).orderBy(asc(adsTable.sortOrder)).limit(1);
  if (!ads.length) { res.json(null); return; }
  res.json(ads[0]);
});

router.get("/admin/ads", requireAuth, requireAdmin, async (_req, res): Promise<void> => {
  const ads = await db.select().from(adsTable).orderBy(asc(adsTable.sortOrder));
  res.json(ads);
});

router.post("/admin/ads", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { type, mediaUrl, title, description, durationSeconds, linkUrl, active, sortOrder } = req.body;
  if (!mediaUrl) { res.status(400).json({ error: "mediaUrl is required" }); return; }
  const [ad] = await db.insert(adsTable).values({
    type: type ?? "image",
    mediaUrl,
    title: title ?? null,
    description: description ?? null,
    durationSeconds: durationSeconds ?? 5,
    linkUrl: linkUrl ?? null,
    active: active ?? true,
    sortOrder: sortOrder ?? 0,
  }).returning();
  res.json(ad);
});

router.put("/admin/ads/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const updates: Record<string, unknown> = {};
  const fields = ["type", "mediaUrl", "title", "description", "durationSeconds", "linkUrl", "active", "sortOrder"] as const;
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  const [ad] = await db.update(adsTable).set(updates).where(eq(adsTable.id, id)).returning();
  res.json(ad);
});

router.delete("/admin/ads/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(adsTable).where(eq(adsTable.id, id));
  res.json({ success: true });
});

export default router;
