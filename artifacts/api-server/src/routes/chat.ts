import { Router, type IRouter } from "express";
import { db, chatMessagesTable, usersTable } from "@workspace/db";
import { desc, eq, inArray } from "drizzle-orm";
import { optionalAuth, requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

function fmtMsg(r: any, replyMap: Map<number, any>) {
  const reply = r.replyToId ? replyMap.get(r.replyToId) : null;
  return {
    id: r.id,
    userId: r.userId,
    username: r.username ?? "Anonim",
    photoUrl: r.photoUrl ?? null,
    message: r.deleted ? "" : r.message,
    deleted: r.deleted ?? false,
    replyToId: r.replyToId ?? null,
    replyTo: reply ? {
      id: reply.id,
      username: reply.username ?? "Anonim",
      message: reply.deleted ? "" : reply.message,
      deleted: reply.deleted ?? false,
    } : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

router.get("/chat", optionalAuth, async (_req, res): Promise<void> => {
  const rows = await db.select()
    .from(chatMessagesTable)
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(100);

  const reversed = rows.reverse();
  const replyIds = reversed.filter(r => r.replyToId).map(r => r.replyToId as number);
  const replyRows = replyIds.length
    ? await db.select().from(chatMessagesTable).where(inArray(chatMessagesTable.id, replyIds))
    : [];
  const replyMap = new Map(replyRows.map(r => [r.id, r]));

  res.json(reversed.map(r => fmtMsg(r, replyMap)));
});

const SendBody = z.object({
  message: z.string().min(1).max(500),
  replyToId: z.number().int().positive().optional(),
});

router.post("/chat", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Pesan tidak valid" }); return; }

  const [userRow] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.user!.id)).limit(1);

  const [row] = await db.insert(chatMessagesTable).values({
    userId: req.user!.id,
    username: req.user!.username,
    photoUrl: userRow?.photoUrl ?? null,
    message: parsed.data.message,
    replyToId: parsed.data.replyToId ?? null,
  }).returning();

  let replyTo = null;
  if (row.replyToId) {
    const [rr] = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, row.replyToId)).limit(1);
    if (rr) replyTo = {
      id: rr.id,
      username: rr.username ?? "Anonim",
      message: rr.deleted ? "" : rr.message,
      deleted: rr.deleted ?? false,
    };
  }

  const replyMap = new Map<number, any>();
  if (row.replyToId && replyTo) replyMap.set(row.replyToId, replyTo);
  res.status(201).json(fmtMsg(row, replyMap));
});

router.delete("/chat/:id", requireAuth, async (req, res): Promise<void> => {
  const msgId = Number(req.params.id);
  if (!Number.isFinite(msgId)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const [msg] = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.id, msgId)).limit(1);
  if (!msg) { res.status(404).json({ error: "Pesan tidak ditemukan" }); return; }

  if (msg.userId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Tidak diizinkan" }); return;
  }

  await db.update(chatMessagesTable)
    .set({ deleted: true })
    .where(eq(chatMessagesTable.id, msgId));
  res.json({ ok: true });
});

export default router;
