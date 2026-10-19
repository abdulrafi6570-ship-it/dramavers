export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';
import { uploadToR2, r2PublicBase } from '../../../lib/r2';

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { data: clips, error } = await db
    .from('clips')
    .select('id, title, video_url, created_at, dramas(title)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clips: clips || [] });
}

// Simpan baris klip + tag aktor ke database
async function saveClip({ drama_id, title, video_url, actorIds }) {
  const db = supabaseAdmin();
  const { data: clip, error } = await db
    .from('clips')
    .insert({ drama_id, title, video_url })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (actorIds.length > 0) {
    await db.from('clip_actors').insert(actorIds.map((aid) => ({ clip_id: clip.id, actor_id: aid })));
  }

  return NextResponse.json({ clip });
}

export async function POST(req) {
  const denied = requireAdmin();
  if (denied) return denied;

  const contentType = req.headers.get('content-type') || '';

  // ===== Cara baru: video sudah diupload langsung ke R2, di sini tinggal menyimpan datanya =====
  if (contentType.includes('application/json')) {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
    }

    const drama_id = body?.drama_id;
    const title = body?.title || '';
    const video_url = body?.video_url;
    const actorIds = Array.isArray(body?.actor_ids) ? body.actor_ids : [];

    if (!drama_id || !video_url) {
      return NextResponse.json({ error: 'Drama & video wajib diisi' }, { status: 400 });
    }

    const base = r2PublicBase();
    if (!base) {
      return NextResponse.json({ error: 'CLOUDFLARE_R2_PUBLIC_URL belum diatur di .env' }, { status: 500 });
    }
    if (!String(video_url).startsWith(`${base}/clips/`)) {
      return NextResponse.json({ error: 'Alamat video tidak valid' }, { status: 400 });
    }

    return saveClip({ drama_id, title, video_url, actorIds });
  }

  // ===== Cara lama: file dikirim lewat server (hanya cocok untuk file kecil) =====
  const form = await req.formData();
  const drama_id = form.get('drama_id');
  const title = form.get('title') || '';
  const video = form.get('video');
  const actorIdsRaw = form.get('actor_ids') || '[]';

  if (!drama_id || !video || video.size === 0) {
    return NextResponse.json({ error: 'Drama & file video wajib diisi' }, { status: 400 });
  }

  let video_url;
  try {
    video_url = await uploadToR2(video, 'clips');
  } catch (e) {
    console.error('[POST /api/clips] upload ke R2 gagal:', e.message);
    return NextResponse.json({ error: `Upload ke R2 gagal: ${e.message}` }, { status: 500 });
  }

  return saveClip({ drama_id, title, video_url, actorIds: JSON.parse(actorIdsRaw) });
}