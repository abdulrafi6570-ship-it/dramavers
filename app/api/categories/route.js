export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

export async function GET() {
  const db = supabaseAdmin();
  const { data } = await db.from('categories').select('*, subcategories(*)').order('sort_order');
  return NextResponse.json({ categories: data || [] });
}

export async function POST(req) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { name, slug } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: 'Nama & slug wajib diisi' }, { status: 400 });

  const db = supabaseAdmin();
    const { data: last } = await db
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? 0) + 1;

  const { data, error } = await db.from('categories').insert({ name, slug, sort_order }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
