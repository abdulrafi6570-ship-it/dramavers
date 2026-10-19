import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const cookieStore = cookies();
    const isUnlocked = cookieStore.get('dramavers_unlocked')?.value === 'true';

    // Jika belum memasukkan kode redeem / belum unlock
    if (!isUnlocked) {
      return NextResponse.json(
        { locked: true, error: 'Silakan masukkan kode dari TikTok terlebih dahulu.' },
        { status: 403 }
      );
    }

    const db = supabaseAdmin();
    const { data: clip, error } = await db
      .from('clips')
      .select('video_url, title')
      .eq('id', id)
      .single();

    if (error || !clip || !clip.video_url) {
      return NextResponse.json({ error: 'Klip tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, url: clip.video_url });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal memproses download.' }, { status: 500 });
  }
}