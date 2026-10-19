export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../../lib/requireAdmin';
import { getSession } from '../../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';

export async function POST(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const session = getSession();
  const db = supabaseAdmin();

  const { data: other } = await db.from('users').select('id').eq('username', params.username.toLowerCase()).maybeSingle();
  if (!other) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

  await db
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', other.id)
    .eq('receiver_id', session.id)
    .is('read_at', null);

  return NextResponse.json({ ok: true });
}
