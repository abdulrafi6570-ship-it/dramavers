export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';
import { uploadToR2, isOwnR2Url } from '../../../lib/r2';

export async function GET() {
  const db = supabaseAdmin();
  const { data } = await db
    .from('dramas')
    .select('id, title, poster_url, scp_url, created_at, categories(name)')
    .order('created_at', { ascending: false });
  return NextResponse.json({ dramas: data || [] });
}

export async function POST(req) {
  const denied = requireAdmin();
  if (denied) return denied;

  const form = await req.formData();
  const title = form.get('title');
  const description = form.get('description') || '';
  const category_id = form.get('category_id');
  const scpRaw = String(form.get('scp_url') || '').trim();
  const subcategory_id = form.get('subcategory_id') || null;
  const poster = form.get('poster');
  const actorIdsRaw = form.get('actor_ids') || '[]';

  if (!title || !category_id) {
    return NextResponse.json({ error: 'Judul & kategori wajib diisi' }, { status: 400 });
  }

  // Link SCP opsional: hanya boleh http/https
  let scp_url = null;
  if (scpRaw) {
    try {
      const u = new URL(scpRaw);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad');
      scp_url = u.toString();
    } catch {
      return NextResponse.json({ error: 'Link SCP tidak valid (harus diawali http:// atau https://)' }, { status: 400 });
    }
  }

  let poster_url = null;
  const posterUrl = String(form.get('poster_url') || '');
  if (posterUrl) {
    if (!isOwnR2Url(posterUrl, ['posters'])) {
      return NextResponse.json({ error: 'Alamat poster tidak valid' }, { status: 400 });
    }
    poster_url = posterUrl;
  } else if (poster && poster.size > 0) {
    poster_url = await uploadToR2(poster, 'posters');
  }

  const db = supabaseAdmin();
  const { data: drama, error } = await db
    .from('dramas')
    .insert({ title, description, scp_url, category_id, subcategory_id: subcategory_id || null, poster_url })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actorIds = JSON.parse(actorIdsRaw);
  if (actorIds.length > 0) {
    await db.from('drama_actors').insert(actorIds.map((aid) => ({ drama_id: drama.id, actor_id: aid })));
  }

  return NextResponse.json({ drama });
}