export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getSession } from '../../../../../lib/auth';

export async function POST(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  const db = supabaseAdmin();
  const { data: existing } = await db
    .from('request_votes')
    .select('*')
    .eq('request_id', params.id)
    .eq('user_id', session.id)
    .maybeSingle();

  if (existing) {
    await db.from('request_votes').delete().eq('request_id', params.id).eq('user_id', session.id);
  } else {
    await db.from('request_votes').insert({ request_id: params.id, user_id: session.id });
  }

  const { count } = await db
    .from('request_votes')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', params.id);

  return NextResponse.json({ voted: !existing, votes: count || 0 });
}
