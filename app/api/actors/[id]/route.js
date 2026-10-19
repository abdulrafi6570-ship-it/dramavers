export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { uploadToR2, isOwnR2Url } from '../../../../lib/r2';

export async function GET(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { data: actor } = await db.from('actors').select('*').eq('id', params.id).maybeSingle();
  if (!actor) return NextResponse.json({ error: 'Aktor tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ actor });
}

export async function PATCH(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const form = await req.formData();
  const name = String(form.get('name') || '').trim();
  const bio = form.get('bio') || '';
  const photo = form.get('photo');

  if (!name) return NextResponse.json({ error: 'Nama aktor wajib diisi' }, { status: 400 });

  const update = { name, bio };
  const photoUrl = String(form.get('photo_url') || '');
  if (photoUrl) {
    if (!isOwnR2Url(photoUrl, ['actors'])) {
      return NextResponse.json({ error: 'Alamat foto tidak valid' }, { status: 400 });
    }
    update.photo_url = photoUrl;
  } else if (photo && photo.size > 0) {
    try {
      update.photo_url = await uploadToR2(photo, 'actors');
    } catch (e) {
      return NextResponse.json({ error: `Upload foto gagal: ${e.message}` }, { status: 500 });
    }
  }

  const db = supabaseAdmin();
  const { data, error } = await db.from('actors').update(update).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actor: data });
}

// Hapus aktor. Tag aktor di drama & klip ikut terhapus (dramanya tetap ada).
export async function DELETE(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { error } = await db.from('actors').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}