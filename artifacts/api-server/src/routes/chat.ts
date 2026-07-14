import { Router, type IRouter } from "express";
import { db, chatMessagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { optionalAuth, requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

router.get("/chat", optionalAuth, async (_req, res): Promise<void> => {
  const rows = await db.select()
    .from(chatMessagesTable)
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(100);
  res.json(rows.reverse().map((r) => ({
    id: r.id,
    userId: r.userId,
    username: r.username ?? "Anonim",
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  })));
});

const SendMessageBody = z.object({ message: z.string().min(1).max(500) });

router.post("/chat", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Pesan tidak valid" }); return; }
  const [row] = await db.insert(chatMessagesTable).values({
    userId: req.user!.id,
    username: req.user!.username,
    message: parsed.data.message,
  }).returning();
  res.status(201).json({
    id: row.id,
    userId: row.userId,
    username: row.username ?? "Anonim",
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  });
});

export default router;
