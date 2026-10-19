export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(req) {
  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  if (!q) return NextResponse.json({ users: [] });

  const db = supabaseAdmin();
  const { data } = await db
    .from('users')
    .select('username, display_name, avatar_url, role')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20);

  return NextResponse.json({ users: data || [] });
}
