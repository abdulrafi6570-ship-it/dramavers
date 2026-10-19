export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getSession } from '../../../../../lib/auth';

export async function POST(req, { params }) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: true }); // guest nonton tetap boleh, cuma nggak dicatat

  const db = supabaseAdmin();
  await db.from('clip_views').insert({ clip_id: params.id, user_id: session.id });
  return NextResponse.json({ ok: true });
}
