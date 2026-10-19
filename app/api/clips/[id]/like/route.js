export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getSession } from '../../../../../lib/auth';

export async function POST(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const clip_id = params.id;

  const { data: existing } = await db
    .from('clip_likes')
    .select('*')
    .eq('clip_id', clip_id)
    .eq('user_id', session.id)
    .maybeSingle();

  if (existing) {
    await db.from('clip_likes').delete().eq('clip_id', clip_id).eq('user_id', session.id);
  } else {
    await db.from('clip_likes').insert({ clip_id, user_id: session.id });
  }

  const { count } = await db
    .from('clip_likes')
    .select('*', { count: 'exact', head: true })
    .eq('clip_id', clip_id);

  return NextResponse.json({ liked: !existing, count: count || 0 });
}

export async function GET(req, { params }) {
  const session = getSession();
  const db = supabaseAdmin();
  const clip_id = params.id;

  const { count } = await db
    .from('clip_likes')
    .select('*', { count: 'exact', head: true })
    .eq('clip_id', clip_id);

  let liked = false;
  if (session) {
    const { data } = await db
      .from('clip_likes')
      .select('*')
      .eq('clip_id', clip_id)
      .eq('user_id', session.id)
      .maybeSingle();
    liked = !!data;
  }

  return NextResponse.json({ count: count || 0, liked });
}
