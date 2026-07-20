import { Router, type IRouter } from "express";
import { db, privateMessagesTable, usersTable, userFollowsTable } from "@workspace/db";
import { and, eq, or, desc, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

async function canChat(currentUserId: number, targetUserId: number): Promise<boolean> {
  if (currentUserId === targetUserId) return false;
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId)).limit(1);
  if (!target) return false;
  if (!target.isPrivate) return true;

  const [aFollowsB] = await db.select().from(userFollowsTable)
    .where(and(eq(userFollowsTable.followerId, currentUserId), eq(userFollowsTable.followingId, targetUserId)))
    .limit(1);
  const [bFollowsA] = await db.select().from(userFollowsTable)
    .where(and(eq(userFollowsTable.followerId, targetUserId), eq(userFollowsTable.followingId, currentUserId)))
    .limit(1);
  return Boolean(aFollowsB && bFollowsA);
}

function fmtMsg(r: any, replyMap: Map<number, any>, me: number) {
  const reply = r.replyToId ? replyMap.get(r.replyToId) : null;
  return {
    id: r.id,
    senderId: r.senderId,
    recipientId: r.recipientId,
    message: r.deleted ? "" : r.message,
    deleted: r.deleted ?? false,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    isMine: r.senderId === me,
    replyToId: r.replyToId ?? null,
    replyTo: reply ? {
      id: reply.id,
      message: reply.deleted ? "" : reply.message,
      deleted: reply.deleted ?? false,
      isMine: reply.senderId === me,
    } : null,
  };
}

router.get("/messages/conversations", requireAuth, async (req, res): Promise<void> => {
  const me = req.user!.id;

  const rows = await db.execute(sql`
    SELECT partner_id, message, created_at, sender_id, is_read FROM (
      SELECT
        CASE WHEN sender_id = ${me} THEN recipient_id ELSE sender_id END AS partner_id,
        message, created_at, sender_id, read AS is_read,
        ROW_NUMBER() OVER (
          PARTITION BY CASE WHEN sender_id = ${me} THEN recipient_id ELSE sender_id END
          ORDER BY created_at DESC
        ) AS rn
      FROM private_messages
      WHERE sender_id = ${me} OR recipient_id = ${me}
    ) t WHERE rn = 1
    ORDER BY created_at DESC
  `);

  const partnerIds = ((rows as any).rows as any[]).map((r: any) => Number(r.partner_id));
  const partners = partnerIds.length
    ? await db.select().from(usersTable).where(sql`${usersTable.id} IN (${sql.join(partnerIds.map((id: number) => sql`${id}`), sql`, `)})`)
    : [];
  const partnerMap = new Map(partners.map((p) => [String(p.id), p]));

  const unreadCounts = await db.execute(sql`
    SELECT sender_id, COUNT(*)::int AS cnt FROM private_messages
    WHERE recipient_id = ${me} AND read = false
    GROUP BY sender_id
  `);
  const unreadMap = new Map(((unreadCounts as any).rows as any[]).map((r: any) => [String(r.sender_id), Number(r.cnt)]));

  res.json(
    ((rows as any).rows as any[]).map((r: any) => {
      const partner = partnerMap.get(String(r.partner_id));
      return {
        userId: Number(r.partner_id),
        username: partner?.username ?? "Pengguna",
        photoUrl: partner?.photoUrl ?? null,
        lastMessage: r.message,
        lastMessageAt: new Date(r.created_at).toISOString(),
        isMine: Number(r.sender_id) === me,
        unreadCount: unreadMap.get(String(r.partner_id)) ?? 0,
      };
    })
  );
});

router.get("/messages/:userId/can-chat", requireAuth, async (req, res): Promise<void> => {
  const targetId = Number(req.params.userId);
  if (!Number.isFinite(targetId)) { res.status(400).json({ error: "ID tidak valid" }); return; }
  const allowed = await canChat(req.user!.id, targetId);
  res.json({ allowed });
});

router.get("/messages/:userId", requireAuth, async (req, res): Promise<void> => {
  const targetId = Number(req.params.userId);
  if (!Number.isFinite(targetId)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const allowed = await canChat(req.user!.id, targetId);
  if (!allowed) { res.status(403).json({ error: "Kamu belum bisa chat dengan pengguna ini" }); return; }

  const me = req.user!.id;
  const rows = await db.select().from(privateMessagesTable)
    .where(or(
      and(eq(privateMessagesTable.senderId, me), eq(privateMessagesTable.recipientId, targetId)),
      and(eq(privateMessagesTable.senderId, targetId), eq(privateMessagesTable.recipientId, me)),
    ))
    .orderBy(desc(privateMessagesTable.createdAt))
    .limit(200);

  await db.update(privateMessagesTable)
    .set({ read: true })
    .where(and(
      eq(privateMessagesTable.senderId, targetId),
      eq(privateMessagesTable.recipientId, me),
      eq(privateMessagesTable.read, false),
    ));

  const reversed = rows.reverse();
  const replyIds = reversed.filter(r => r.replyToId).map(r => r.replyToId as number);
  const replyRows = replyIds.length
    ? await db.select().from(privateMessagesTable).where(inArray(privateMessagesTable.id, replyIds))
    : [];
  const replyMap = new Map(replyRows.map(r => [r.id, r]));

  res.json(reversed.map(r => fmtMsg(r, replyMap, me)));
});

const SendBody = z.object({
  message: z.string().min(1).max(1000),
  replyToId: z.number().int().positive().optional(),
});

router.post("/messages/:userId", requireAuth, async (req, res): Promise<void> => {
  const targetId = Number(req.params.userId);
  if (!Number.isFinite(targetId)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const parsed = SendBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Pesan tidak valid" }); return; }

  const allowed = await canChat(req.user!.id, targetId);
  if (!allowed) { res.status(403).json({ error: "Kamu belum bisa chat dengan pengguna ini" }); return; }

  const me = req.user!.id;
  const [row] = await db.insert(privateMessagesTable).values({
    senderId: me,
    recipientId: targetId,
    message: parsed.data.message,
    replyToId: parsed.data.replyToId ?? null,
  }).returning();

  let replyTo = null;
  if (row.replyToId) {
    const [rr] = await db.select().from(privateMessagesTable)
      .where(eq(privateMessagesTable.id, row.replyToId)).limit(1);
    if (rr) replyTo = rr;
  }

  const replyMap = new Map<number, any>();
  if (row.replyToId && replyTo) replyMap.set(row.replyToId, replyTo);
  res.status(201).json(fmtMsg(row, replyMap, me));
});

// Soft-delete a DM message
router.delete("/messages/msg/:id", requireAuth, async (req, res): Promise<void> => {
  const msgId = Number(req.params.id);
  if (!Number.isFinite(msgId)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const [msg] = await db.select().from(privateMessagesTable)
    .where(eq(privateMessagesTable.id, msgId)).limit(1);
  if (!msg) { res.status(404).json({ error: "Pesan tidak ditemukan" }); return; }

  if (msg.senderId !== req.user!.id) {
    res.status(403).json({ error: "Tidak diizinkan" }); return;
  }

  await db.update(privateMessagesTable)
    .set({ deleted: true })
    .where(eq(privateMessagesTable.id, msgId));
  res.json({ ok: true });
});

export default router;
