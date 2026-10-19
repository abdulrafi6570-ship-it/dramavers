export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ user: null });
  const db = supabaseAdmin();
  const { data: user } = await db
    .from('users')
    .select('id, username, display_name, bio, avatar_url, role, credits, downloads_unlocked, username_changed_at')
    .eq('id', session.id)
    .maybeSingle();
  return NextResponse.json({ user });
}
