import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ codes: data });
}

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Kode tidak boleh kosong.' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data, error } = await db
      .from('redeem_codes')
      .insert([{ code: code.trim() }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Kode sudah ada atau gagal disimpan.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kode diperlukan.' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { error } = await db.from('redeem_codes').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Gagal menghapus kode.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}