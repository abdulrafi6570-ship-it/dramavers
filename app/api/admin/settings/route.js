import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = supabaseAdmin();

    const { data: codes } = await db
      .from('redeem_codes')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: announcement } = await db
      .from('site_announcements')
      .select('*')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      codes: codes || [],
      announcement: announcement || {
        running_text:
          '🔥 Ambil kode akses download klip terbaru di TikTok kami! Sekali masukin kode, bebas download selamanya!',
        tiktok_url: 'https://www.tiktok.com',
        is_active: true,
      },
    });
  } catch (err) {
    return NextResponse.json({ codes: [], announcement: null }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const db = supabaseAdmin();

    // Jika request untuk menyimpan pengaturan Pengumuman Berjalan & Link TikTok
    if (body.type === 'announcement') {
      const { running_text, tiktok_url, is_active } = body;
      const { data, error } = await db
        .from('site_announcements')
        .upsert({
          id: 1,
          running_text: running_text || '',
          tiktok_url: tiktok_url || '',
          is_active: Boolean(is_active),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Gagal menyimpan pengumuman. Pastikan SQL site_announcements sudah dijalankan.' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, announcement: data });
    }

    // Jika request untuk menambah Kode Redeem TikTok baru
    const { code } = body;
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Kode tidak boleh kosong.' }, { status: 400 });
    }

    const { data, error } = await db
      .from('redeem_codes')
      .insert([{ code: code.trim() }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Kode sudah ada atau tabel redeem_codes belum dibuat.' },
        { status: 400 }
      );
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