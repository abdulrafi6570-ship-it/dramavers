export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getSession } from '../../../../../lib/auth';

export async function GET(req, { params }) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('clip_comments')
    .select('id, body, created_at, users(username, avatar_url)')
    .eq('clip_id', params.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

export async function POST(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const { body } = await req.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('clip_comments')
    .insert({ clip_id: params.id, user_id: session.id, body: body.trim() })
    .select('id, body, created_at, users(username, avatar_url)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
