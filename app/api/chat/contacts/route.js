export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();

  const { data: rows } = await db
    .from('messages')
    .select('sender_id, receiver_id, content, shared_drama_id, created_at')
    .not('receiver_id', 'is', null)
    .or(`sender_id.eq.${session.id},receiver_id.eq.${session.id}`)
    .order('created_at', { ascending: false })
    .limit(500);

  const seen = new Map();
  for (const row of rows || []) {
    const partnerId = row.sender_id === session.id ? row.receiver_id : row.sender_id;
    if (seen.has(partnerId)) continue;
    seen.set(partnerId, {
      last_at: row.created_at,
      last_content: row.shared_drama_id ? '📎 Bagikan drama' : row.content || '',
      mine: row.sender_id === session.id,
    });
  }

  const partnerIds = [...seen.keys()];
  if (partnerIds.length === 0) return NextResponse.json({ contacts: [] });

  const { data: users } = await db
    .from('users')
    .select('id, username, display_name, avatar_url')
    .in('id', partnerIds);

  const contacts = (users || [])
    .map((u) => ({ ...u, ...seen.get(u.id) }))
    .sort((a, b) => new Date(b.last_at) - new Date(a.last_at));

  return NextResponse.json({ contacts });
}