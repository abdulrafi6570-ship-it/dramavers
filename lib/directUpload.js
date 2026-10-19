// Upload gambar langsung dari browser ke R2 (tidak lewat server Vercel).
// Kembalikan public URL-nya, atau lempar Error dengan pesan yang bisa ditampilkan.
export async function uploadImageDirect(file, folder) {
  const contentType = file.type || 'image/jpeg';
  const r = await fetch('/api/upload/image-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, contentType, size: file.size }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Gagal menyiapkan upload (status ${r.status})`);

  const put = await fetch(d.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': d.contentType },
    body: file,
  }).catch(() => {
    throw new Error('Upload gambar ke R2 gagal. Cek CORS bucket R2 untuk alamat web ini.');
  });
  if (!put.ok) throw new Error(`R2 menolak upload gambar (status ${put.status})`);
  return d.publicUrl;
}
