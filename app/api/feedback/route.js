export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getSession } from '../../../lib/auth';

export async function POST(req) {
  const session = getSession();
  const { message, image_url } = await req.json();
  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'Pesan feedback tidak boleh kosong' }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { error } = await db.from('user_feedback').insert({
    user_id: session?.id || null,
    username: session?.username || null,
    message: message.trim(),
    image_url: image_url || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
