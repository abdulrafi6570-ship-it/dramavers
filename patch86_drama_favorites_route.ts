import { Router, type IRouter } from "express";
import { db, dramaFavoritesTable, dramasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

function formatDrama(d: any) {
  return {
    id: d.id, name: d.name, category: d.category ?? "kdrama",
    genre: d.genre ?? null, description: d.description ?? null,
    posterUrl: d.posterUrl ?? null, videoCount: d.videoCount ?? 0,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
  };
}

const DramaIdParam = z.object({ dramaId: z.coerce.number() });

router.get("/drama-favorites", requireAuth, async (req, res): Promise<void> => {
  const rows = await db.select({ drama: dramasTable })
    .from(dramaFavoritesTable)
    .innerJoin(dramasTable, eq(dramaFavoritesTable.dramaId, dramasTable.id))
    .where(eq(dramaFavoritesTable.userId, req.user!.id));

  res.json(rows.map((r) => formatDrama(r.drama)));
});

router.post("/drama-favorites/:dramaId", requireAuth, async (req, res): Promise<void> => {
  const parsed = DramaIdParam.safeParse({ dramaId: req.params.dramaId });
  if (!parsed.success) { res.status(400).json({ error: "Invalid dramaId" }); return; }

  const existing = await db.select().from(dramaFavoritesTable).where(
    and(eq(dramaFavoritesTable.userId, req.user!.id), eq(dramaFavoritesTable.dramaId, parsed.data.dramaId))
  );
  if (existing.length === 0) {
    await db.insert(dramaFavoritesTable).values({ userId: req.user!.id, dramaId: parsed.data.dramaId });
  }
  res.json({ success: true });
});

router.delete("/drama-favorites/:dramaId", requireAuth, async (req, res): Promise<void> => {
  const parsed = DramaIdParam.safeParse({ dramaId: req.params.dramaId });
  if (!parsed.success) { res.status(400).json({ error: "Invalid dramaId" }); return; }

  await db.delete(dramaFavoritesTable).where(
    and(eq(dramaFavoritesTable.userId, req.user!.id), eq(dramaFavoritesTable.dramaId, parsed.data.dramaId))
  );
  res.json({ success: true });
});

export default router;
