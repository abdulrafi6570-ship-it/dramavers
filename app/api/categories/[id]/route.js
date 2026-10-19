export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';

// Ubah nama kategori (slug tetap, supaya link /category/<slug> tidak rusak)
export async function PATCH(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

// Hapus kategori. Sub-kategorinya ikut terhapus; drama di dalamnya TIDAK terhapus
// (kategorinya jadi kosong / "Tanpa kategori").
export async function DELETE(req, { params }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const db = supabaseAdmin();
  const { error } = await db.from('categories').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}