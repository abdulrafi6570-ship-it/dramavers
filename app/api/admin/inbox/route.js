export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { getSession } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  const session = getSession();
  const db = supabaseAdmin();

  const { data: rows } = await db
    .from('messages')
    .select('id, content, created_at, sender_id, receiver_id, read_at, sender:sender_id(username, display_name, avatar_url), receiver:receiver_id(username, display_name, avatar_url)')
    .not('receiver_id', 'is', null)
    .or(`sender_id.eq.${session.id},receiver_id.eq.${session.id}`)
    .order('created_at', { ascending: false })
    .limit(500);

  const byUser = new Map();
  for (const m of rows || []) {
    const other = m.sender_id === session.id ? m.receiver : m.sender;
    const otherId = m.sender_id === session.id ? m.receiver_id : m.sender_id;
    if (!otherId || !other) continue;
    if (!byUser.has(otherId)) {
      byUser.set(otherId, {
        username: other.username,
        display_name: other.display_name,
        avatar_url: other.avatar_url,
        last_message: m.content,
        last_at: m.created_at,
        unread: 0,
      });
    }
    const entry = byUser.get(otherId);
    // pesan masuk (dari user ke admin) yang belum dibaca
    if (m.receiver_id === session.id && !m.read_at) entry.unread += 1;
  }

  const conversations = Array.from(byUser.values()).sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
  return NextResponse.json({ conversations });
}
