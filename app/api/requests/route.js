export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getSession } from '../../../lib/auth';

export async function GET() {
  const session = getSession();
  const db = supabaseAdmin();

  const { data: requests } = await db
    .from('content_requests')
    .select('id, drama, actor, scene, episode, created_at, user_id, users(username)')
    .order('created_at', { ascending: false });

  const withVotes = await Promise.all(
    (requests || []).map(async (r) => {
      const { count } = await db
        .from('request_votes')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', r.id);

      let voted = false;
      if (session) {
        const { data } = await db
          .from('request_votes')
          .select('*')
          .eq('request_id', r.id)
          .eq('user_id', session.id)
          .maybeSingle();
        voted = !!data;
      }
      return { ...r, votes: count || 0, voted };
    })
  );

  withVotes.sort((a, b) => b.votes - a.votes || new Date(b.created_at) - new Date(a.created_at));
  return NextResponse.json({ requests: withVotes });
}

export async function POST(req) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const { drama, actor, scene, episode } = await req.json();
  if (!drama || !drama.trim()) return NextResponse.json({ error: 'Nama drama wajib diisi' }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('content_requests')
    .insert({
      user_id: session.id,
      drama: drama.trim(),
      actor: actor?.trim() || null,
      scene: scene?.trim() || null,
      episode: episode?.trim() || null,
    })
    .select('id, drama, actor, scene, episode, created_at, user_id, users(username)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // auto-vote request sendiri
  await db.from('request_votes').insert({ request_id: data.id, user_id: session.id });

  return NextResponse.json({ request: { ...data, votes: 1, voted: true } });
}
