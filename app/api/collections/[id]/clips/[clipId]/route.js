export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';
import { getSession } from '../../../../../../lib/auth';

async function assertOwns(db, id, userId) {
  const { data } = await db.from('collections').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  return data;
}

export async function POST(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const owned = await assertOwns(db, params.id, session.id);
  if (!owned) return NextResponse.json({ error: 'Koleksi tidak ditemukan' }, { status: 404 });

  await db.from('collection_clips').upsert(
    { collection_id: params.id, clip_id: params.clipId },
    { onConflict: 'collection_id,clip_id', ignoreDuplicates: true }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const owned = await assertOwns(db, params.id, session.id);
  if (!owned) return NextResponse.json({ error: 'Koleksi tidak ditemukan' }, { status: 404 });

  await db.from('collection_clips').delete().eq('collection_id', params.id).eq('clip_id', params.clipId);
  return NextResponse.json({ ok: true });
}
