export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const db = supabaseAdmin();
  const { data: messages, error } = await db
    .from('messages')
    .select('id, content, created_at, sender_id, shared_drama_id')
    .is('receiver_id', null)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = messages || [];
  const senderIds = [...new Set(rows.map((m) => m.sender_id).filter(Boolean))];
  const dramaIds = [...new Set(rows.map((m) => m.shared_drama_id).filter(Boolean))];

  const [{ data: senders }, { data: dramas }] = await Promise.all([
    senderIds.length
      ? db.from('users').select('id, username, display_name, avatar_url, role').in('id', senderIds)
      : Promise.resolve({ data: [] }),
    dramaIds.length
      ? db.from('dramas').select('id, title, poster_url').in('id', dramaIds)
      : Promise.resolve({ data: [] }),
  ]);

  const senderMap = Object.fromEntries((senders || []).map((s) => [s.id, s]));
  const dramaMap = Object.fromEntries((dramas || []).map((d) => [d.id, d]));

  const enriched = rows.map((m) => ({
    ...m,
    sender: senderMap[m.sender_id] || null,
    drama: m.shared_drama_id ? dramaMap[m.shared_drama_id] || null : null,
  }));

  return NextResponse.json(
    { messages: enriched },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}