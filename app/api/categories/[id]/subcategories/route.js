export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../../lib/requireAdmin';

export async function POST(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { name, slug } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: 'Nama & slug wajib diisi' }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('subcategories')
    .insert({ category_id: params.id, name, slug })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subcategory: data });
}
