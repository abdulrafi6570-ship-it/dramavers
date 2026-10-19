export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(req) {
  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  const db = supabaseAdmin();

  // Tanpa kata kunci: tampilkan drama terbaru (poster) supaya halaman cari tidak kosong
  if (!q) {
    const { data } = await db
      .from('dramas')
      .select('id, title, poster_url, categories(name, slug)')
      .order('created_at', { ascending: false })
      .limit(24);
    return NextResponse.json({ dramas: data || [], categories: [] });
  }

  const [{ data: dramas }, { data: categories }] = await Promise.all([
    db
      .from('dramas')
      .select('id, title, poster_url, categories(name, slug)')
      .ilike('title', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('categories')
      .select('id, name, slug')
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
      .limit(10),
  ]);

  return NextResponse.json({ dramas: dramas || [], categories: categories || [] });
}