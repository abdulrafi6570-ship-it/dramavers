export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(req) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const { username } = await req.json();
  const db = supabaseAdmin();
  const { data: target } = await db.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle();
  if (!target) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
  if (target.id === session.id) return NextResponse.json({ error: 'Tidak bisa follow diri sendiri' }, { status: 400 });

  const { data: existing } = await db
    .from('follows')
    .select('*')
    .eq('follower_id', session.id)
    .eq('following_id', target.id)
    .maybeSingle();

  if (existing) {
    await db.from('follows').delete().eq('follower_id', session.id).eq('following_id', target.id);
    return NextResponse.json({ following: false });
  } else {
    await db.from('follows').insert({ follower_id: session.id, following_id: target.id });
    return NextResponse.json({ following: true });
  }
}
