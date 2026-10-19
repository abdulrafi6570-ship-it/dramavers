import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { keyFromPublicUrl, presignDownload } from '../../../../../lib/r2';

// POST: Mengecek apakah pengguna sudah memasukkan kode TikTok
export async function POST(req, { params }) {
  try {
    const { id } = params;
    const cookieStore = cookies();
    const isUnlocked = cookieStore.get('dramavers_unlocked')?.value === 'true';

    if (!isUnlocked) {
      return NextResponse.json(
        { locked: true, error: 'Silakan masukkan kode dari TikTok terlebih dahulu.' },
        { status: 403 }
      );
    }

    const db = supabaseAdmin();
    const { data: clip, error } = await db
      .from('clips')
      .select('id, video_url, title')
      .eq('id', id)
      .single();

    if (error || !clip || !clip.video_url) {
      return NextResponse.json({ error: 'Klip tidak ditemukan.' }, { status: 404 });
    }

    // Kembalikan URL endpoint GET di bawah agar langsung ter-download di halaman yang sama
    return NextResponse.json({
      success: true,
      downloadUrl: `/api/clips/${clip.id}/download`,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal memproses download.' }, { status: 500 });
  }
}

// GET: Mengirimkan file video langsung sebagai unduhan (tidak buka tab baru)
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const cookieStore = cookies();
    const isUnlocked = cookieStore.get('dramavers_unlocked')?.value === 'true';

    if (!isUnlocked) {
      return new NextResponse('Akses download terkunci.', { status: 403 });
    }

    const db = supabaseAdmin();
    const { data: clip, error } = await db
      .from('clips')
      .select('video_url, title')
      .eq('id', id)
      .single();

    if (error || !clip || !clip.video_url) {
      return new NextResponse('Video tidak ditemukan.', { status: 404 });
    }

    const key = keyFromPublicUrl(clip.video_url);
    if (!key) {
      // Video di luar bucket kita: arahkan langsung saja
      return NextResponse.redirect(clip.video_url, 302);
    }

    const safeTitle = (clip.title || 'dramavers-clip')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 60);
    const ext = (key.split('.').pop() || 'mp4').toLowerCase();

    // Download langsung dari R2 (tidak di-proxy lewat Vercel): hemat bandwidth,
    // tidak kena batas waktu fungsi, dan file HD besar tetap lancar.
    const url = await presignDownload({ key, filename: `${safeTitle}.${ext}` });
    return NextResponse.redirect(url, 302);
  } catch (err) {
    return new NextResponse('Gagal mengunduh video.', { status: 500 });
  }
}