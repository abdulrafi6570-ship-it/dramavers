export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { getSession } from '../../../../lib/auth';

async function assertOwns(db, id, userId) {
  const { data } = await db.from('collections').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  return data;
}

export async function GET(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const owned = await assertOwns(db, params.id, session.id);
  if (!owned) return NextResponse.json({ error: 'Koleksi tidak ditemukan' }, { status: 404 });

  const { data: rows } = await db
    .from('collection_clips')
    .select('added_at, clips(id, title, video_url, drama_id, dramas(id, title))')
    .eq('collection_id', params.id)
    .order('added_at', { ascending: false });

  return NextResponse.json({
    collection: owned,
    clips: (rows || []).map((r) => r.clips).filter(Boolean),
  });
}

export async function PATCH(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const owned = await assertOwns(db, params.id, session.id);
  if (!owned) return NextResponse.json({ error: 'Koleksi tidak ditemukan' }, { status: 404 });

  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  await db.from('collections').update({ name: name.trim() }).eq('id', params.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const owned = await assertOwns(db, params.id, session.id);
  if (!owned) return NextResponse.json({ error: 'Koleksi tidak ditemukan' }, { status: 404 });

  await db.from('collections').delete().eq('id', params.id);
  return NextResponse.json({ ok: true });
}
