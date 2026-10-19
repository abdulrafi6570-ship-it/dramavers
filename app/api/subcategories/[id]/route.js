export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';

export async function PATCH(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('subcategories')
    .update({ name: name.trim() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ subcategory: data });
}

export async function DELETE(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { error } = await db.from('subcategories').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}