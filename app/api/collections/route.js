export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getSession } from '../../../lib/auth';

export async function GET(req) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clipId = searchParams.get('clipId');

  const db = supabaseAdmin();
  const { data: collections } = await db
    .from('collections')
    .select('*')
    .eq('user_id', session.id)
    .order('created_at', { ascending: false });

  const withCovers = await Promise.all(
    (collections || []).map(async (c) => {
      const { count } = await db
        .from('collection_clips')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', c.id);

      const { data: cover } = await db
        .from('collection_clips')
        .select('clips(video_url)')
        .eq('collection_id', c.id)
        .order('added_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let is_member = false;
      if (clipId) {
        const { data: membership } = await db
          .from('collection_clips')
          .select('*')
          .eq('collection_id', c.id)
          .eq('clip_id', clipId)
          .maybeSingle();
        is_member = !!membership;
      }

      return { ...c, clip_count: count || 0, cover_url: cover?.clips?.video_url || null, is_member };
    })
  );

  return NextResponse.json({ collections: withCovers });
}

export async function POST(req) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Nama koleksi wajib diisi' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('collections')
    .insert({ user_id: session.id, name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: { ...data, clip_count: 0, cover_url: null } });
}
