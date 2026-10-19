export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data || [] });
}
