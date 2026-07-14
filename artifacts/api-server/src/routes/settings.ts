import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/settings/:key", async (req: Request, res: Response): Promise<void> => {
  const key = String(req.params.key);
  const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  res.json(setting ?? null);
});

router.put("/admin/settings/:key", requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const key = String(req.params.key);
  const { value } = req.body;
  const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  if (existing.length) {
    const [s] = await db.update(siteSettingsTable)
      .set({ value: value ?? null, updatedAt: new Date() })
      .where(eq(siteSettingsTable.key, key))
      .returning();
    res.json(s);
  } else {
    const [s] = await db.insert(siteSettingsTable)
      .values({ key, value: value ?? null })
      .returning();
    res.json(s);
  }
});

export default router;
