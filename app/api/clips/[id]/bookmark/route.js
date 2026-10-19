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
    .from('clip_bookmarks')
    .select('*')
    .eq('clip_id', clip_id)
    .eq('user_id', session.id)
    .maybeSingle();

  if (existing) {
    await db.from('clip_bookmarks').delete().eq('clip_id', clip_id).eq('user_id', session.id);
  } else {
    await db.from('clip_bookmarks').insert({ clip_id, user_id: session.id });
  }

  return NextResponse.json({ bookmarked: !existing });
}

export async function GET(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ bookmarked: false });

  const db = supabaseAdmin();
  const { data } = await db
    .from('clip_bookmarks')
    .select('*')
    .eq('clip_id', params.id)
    .eq('user_id', session.id)
    .maybeSingle();

  return NextResponse.json({ bookmarked: !!data });
}
