export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';
import { uploadToR2, isOwnR2Url } from '../../../lib/r2';

export async function GET() {
  const db = supabaseAdmin();
  const { data } = await db.from('actors').select('*').order('name');
  return NextResponse.json({ actors: data || [] });
}

export async function POST(req) {
  const denied = requireAdmin();
  if (denied) return denied;

  const form = await req.formData();
  const name = form.get('name');
  const bio = form.get('bio') || '';
  const photo = form.get('photo');

  if (!name) return NextResponse.json({ error: 'Nama aktor wajib diisi' }, { status: 400 });

  let photo_url = null;
  const photoUrl = String(form.get('photo_url') || '');
  if (photoUrl) {
    if (!isOwnR2Url(photoUrl, ['actors'])) {
      return NextResponse.json({ error: 'Alamat foto tidak valid' }, { status: 400 });
    }
    photo_url = photoUrl;
  } else if (photo && photo.size > 0) {
    photo_url = await uploadToR2(photo, 'actors');
  }

  const db = supabaseAdmin();
  const { data, error } = await db.from('actors').insert({ name, bio, photo_url }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actor: data });
}
