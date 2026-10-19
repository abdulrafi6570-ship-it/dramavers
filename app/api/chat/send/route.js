export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(req) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const { to_username, content, shared_drama_id } = await req.json();
  const db = supabaseAdmin();

  let receiver_id = null;
  if (to_username) {
    const { data: receiver } = await db.from('users').select('id').eq('username', to_username.toLowerCase()).maybeSingle();
    if (!receiver) return NextResponse.json({ error: 'User tujuan tidak ditemukan' }, { status: 404 });
    receiver_id = receiver.id;
  }

  const { data: msg, error } = await db
    .from('messages')
    .insert({
      sender_id: session.id,
      receiver_id,
      content: content || '',
      shared_drama_id: shared_drama_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: msg });
}
