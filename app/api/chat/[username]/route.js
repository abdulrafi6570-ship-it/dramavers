export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: other } = await db.from('users').select('id, username, display_name, avatar_url').eq('username', params.username.toLowerCase()).maybeSingle();
  if (!other) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

  const { data: messages } = await db
    .from('messages')
    .select('id, content, created_at, sender_id, shared_drama_id, drama:shared_drama_id(id, title, poster_url)')
    .or(`and(sender_id.eq.${session.id},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${session.id})`)
    .order('created_at', { ascending: true })
    .limit(300);

  return NextResponse.json({ other, messages: messages || [] });
}
