export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth';
import { presignUpload } from '../../../../lib/r2';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB untuk gambar
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/avif': 'avif',
};

// Minta alamat upload langsung ke R2 untuk gambar (poster, foto aktor, avatar).
// posters/actors: admin saja. avatars: user yang login.
export async function POST(req) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
  }

  const { folder, contentType = '', size = 0 } = body || {};
  if (!['posters', 'actors', 'avatars'].includes(folder)) {
    return NextResponse.json({ error: 'Folder tidak valid' }, { status: 400 });
  }
  if (folder !== 'avatars' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Khusus admin' }, { status: 403 });
  }
  const ext = EXT_BY_TYPE[contentType];
  if (!ext) return NextResponse.json({ error: 'File harus berupa gambar (jpg, png, webp, gif)' }, { status: 400 });
  if (!size || size > MAX_BYTES) {
    return NextResponse.json({ error: 'Ukuran gambar maksimal 50 MB' }, { status: 400 });
  }

  try {
    const { uploadUrl, publicUrl } = await presignUpload({ folder, ext, contentType });
    return NextResponse.json({ uploadUrl, publicUrl, contentType });
  } catch (e) {
    return NextResponse.json({ error: `Gagal menyiapkan upload: ${e.message}` }, { status: 500 });
  }
}
