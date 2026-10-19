export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { uploadToR2, isOwnR2Url } from '../../../../lib/r2';
import { parseOptionalHttpUrl } from '../../../../lib/url';

export async function GET(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { data: drama } = await db.from('dramas').select('*').eq('id', params.id).maybeSingle();
  if (!drama) return NextResponse.json({ error: 'Drama tidak ditemukan' }, { status: 404 });

  const { data: tags } = await db.from('drama_actors').select('actor_id').eq('drama_id', params.id);
  return NextResponse.json({ drama, actor_ids: (tags || []).map((t) => t.actor_id) });
}

export async function PATCH(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  const description = form.get('description') || '';
  const category_id = form.get('category_id');
  const subcategory_id = form.get('subcategory_id') || null;
  const poster = form.get('poster');
  const actorIdsRaw = form.get('actor_ids') || '[]';

  if (!title || !category_id) {
    return NextResponse.json({ error: 'Judul & kategori wajib diisi' }, { status: 400 });
  }

  const scp = parseOptionalHttpUrl(form.get('scp_url'));
  if (!scp.ok) {
    return NextResponse.json({ error: 'Link SCP tidak valid (harus diawali http:// atau https://)' }, { status: 400 });
  }

  const update = {
    title,
    description,
    scp_url: scp.url,
    category_id,
    subcategory_id: subcategory_id || null,
  };

  const posterUrl = String(form.get('poster_url') || '');
  if (posterUrl) {
    if (!isOwnR2Url(posterUrl, ['posters'])) {
      return NextResponse.json({ error: 'Alamat poster tidak valid' }, { status: 400 });
    }
    update.poster_url = posterUrl;
  } else if (poster && poster.size > 0) {
    try {
      update.poster_url = await uploadToR2(poster, 'posters');
    } catch (e) {
      return NextResponse.json({ error: `Upload poster gagal: ${e.message}` }, { status: 500 });
    }
  }

  const db = supabaseAdmin();
  const { data: drama, error } = await db.from('dramas').update(update).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let actorIds = [];
  try { actorIds = JSON.parse(actorIdsRaw); } catch {}

  await db.from('drama_actors').delete().eq('drama_id', params.id);
  if (actorIds.length > 0) {
    const { error: tagError } = await db
      .from('drama_actors')
      .insert(actorIds.map((aid) => ({ drama_id: params.id, actor_id: aid })));
    if (tagError) return NextResponse.json({ error: tagError.message }, { status: 500 });
  }

  return NextResponse.json({ drama });
}

// Hapus drama. SEMUA klip di dalamnya ikut terhapus (cascade di database).
export async function DELETE(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { error } = await db.from('dramas').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}