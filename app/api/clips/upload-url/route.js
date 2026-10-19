export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { presignUpload } from '../../../../lib/r2';

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

const EXT_BY_TYPE = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
  'video/3gpp': '3gp',
  'video/x-m4v': 'm4v',
};

function pickExt(filename = '', contentType = '') {
  const fromName = String(filename).split('.').pop().toLowerCase();
  if (/^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return EXT_BY_TYPE[contentType] || 'mp4';
}

// Minta alamat upload sementara ke R2. Hanya admin.
export async function POST(req) {
  const denied = requireAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
  }

  const { filename = '', contentType = '', size = 0 } = body || {};

  if (!String(contentType).startsWith('video/')) {
    return NextResponse.json({ error: 'File harus berupa video' }, { status: 400 });
  }
  if (!size || size <= 0) {
    return NextResponse.json({ error: 'Ukuran file tidak terbaca' }, { status: 400 });
  }
  if (size > MAX_BYTES) {
    return NextResponse.json({ error: 'Ukuran video maksimal 2 GB' }, { status: 400 });
  }

  try {
    const { uploadUrl, publicUrl } = await presignUpload({
      folder: 'clips',
      ext: pickExt(filename, contentType),
      contentType,
    });
    return NextResponse.json({ uploadUrl, publicUrl, contentType });
  } catch (e) {
    console.error('[POST /api/clips/upload-url] gagal membuat alamat upload:', e.message);
    return NextResponse.json({ error: `Gagal menyiapkan upload: ${e.message}` }, { status: 500 });
  }
}