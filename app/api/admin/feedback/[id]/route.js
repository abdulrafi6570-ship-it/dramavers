export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/requireAdmin';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function PATCH(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { status } = await req.json();
  if (!['new', 'read', 'done'].includes(status)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
  }

  const db = supabaseAdmin();
  await db.from('user_feedback').update({ status }).eq('id', params.id);
  return NextResponse.json({ ok: true });
}
