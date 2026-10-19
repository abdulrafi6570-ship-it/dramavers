import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Kode harus diisi.' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { data: match, error } = await db
      .from('redeem_codes')
      .select('*')
      .eq('code', code.trim())
      .single();

    if (error || !match) {
      return NextResponse.json({ error: 'Kode TikTok tidak valid!' }, { status: 400 });
    }

    // Set cookie tanda sudah unlock (berlaku 1 tahun)
    cookies().set({
      name: 'dramavers_unlocked',
      value: 'true',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Berhasil membuka akses download!' });
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}