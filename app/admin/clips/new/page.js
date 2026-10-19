'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Upload, ExternalLink } from 'lucide-react';
import PageHeader from '../../../../components/admin/PageHeader';
import Notice from '../../../../components/admin/Notice';
import ActorPicker from '../../../../components/admin/ActorPicker';

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

// Kirim file langsung ke R2 dengan persentase progres
function putWithProgress(url, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 menolak upload (status ${xhr.status}). Cek isian .env R2 dan izin bucket.`));
    };
    xhr.onerror = () =>
      reject(
        new Error(
          'Upload ke R2 gagal. Biasanya karena CORS bucket belum diatur untuk alamat web ini, atau koneksi terputus.'
        )
      );
    xhr.send(file);
  });
}

export default function NewClipPage() {
  const [dramas, setDramas] = useState([]);
  const [actors, setActors] = useState([]);
  const [dramaId, setDramaId] = useState('');
  const [title, setTitle] = useState('');
  const [video, setVideo] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [selectedActors, setSelectedActors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [doneDramaId, setDoneDramaId] = useState('');

  useEffect(() => {
    fetch('/api/dramas').then((r) => r.json()).then((d) => setDramas(d.dramas || []));
    fetch('/api/actors').then((r) => r.json()).then((d) => setActors(d.actors || []));
  }, []);

  function toggleActor(id) {
    setSelectedActors((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e) {
    e.preventDefault();
    if (!video) return setMsg('Pilih file video dulu');
    if (video.size > MAX_BYTES) return setMsg('Ukuran video maksimal 2 GB.');

    setLoading(true);
    setDoneDramaId('');
    setMsg('');
    setProgress(0);
    setStage('Menyiapkan upload...');

    try {
      // 1) Minta alamat upload sementara ke server
      const contentType = video.type || 'video/mp4';
      const r1 = await fetch('/api/clips/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: video.name, contentType, size: video.size }),
      });
      const d1 = await r1.json().catch(() => ({}));
      if (!r1.ok) {
        setMsg(d1.error || `Gagal menyiapkan upload (status ${r1.status}).`);
        return;
      }

      // 2) Kirim video langsung ke R2 (tidak lewat server)
      setStage('Mengupload video ke R2');
      await putWithProgress(d1.uploadUrl, video, d1.contentType, setProgress);

      // 3) Simpan data klip ke database
      setStage('Menyimpan klip...');
      setProgress(100);
      const r2 = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drama_id: dramaId,
          title,
          video_url: d1.publicUrl,
          actor_ids: selectedActors,
        }),
      });
      const d2 = await r2.json().catch(() => ({}));
      if (!r2.ok) {
        setMsg(d2.error || `Video sudah terupload, tapi gagal menyimpan klip (status ${r2.status}).`);
        return;
      }

      setMsg('Klip berhasil diupload ✓');
      setDoneDramaId(dramaId);
      setTitle('');
      setVideo(null);
      setSelectedActors([]);
      setFileKey((k) => k + 1);
    } catch (err) {
      setMsg(err?.message || 'Upload gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={Upload}
        title="Upload Klip Video"
        subtitle="Pilih drama, pilih video, lalu tag aktor"
      />

      <form onSubmit={submit} className="space-y-5">
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {/* Kiri: data klip */}
          <section className="a-panel space-y-4 p-4 sm:p-5">
            <div>
              <label className="a-label">Drama / Film</label>
              <select
                className="input"
                value={dramaId}
                onChange={(e) => setDramaId(e.target.value)}
                required
              >
                <option value="">Pilih drama / film</option>
                {dramas.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="a-label">Judul klip (opsional)</label>
              <input
                className="input"
                placeholder="mis. Adegan hujan ep. 3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="a-label">File video (dari galeri)</label>
              <input
                key={fileKey}
                type="file"
                accept="video/*"
                onChange={(e) => setVideo(e.target.files[0] || null)}
                className="a-file"
                required
              />
              {video && (
                <p className="mt-2 truncate text-xs text-[#777770]">
                  {video.name} · {formatSize(video.size)}
                </p>
              )}
            </div>
          </section>

          {/* Kanan: tag aktor */}
          <section className="a-panel p-4 sm:p-5">
            <ActorPicker
              actors={actors}
              selected={selectedActors}
              onToggle={toggleActor}
              label="Tag aktor di klip ini"
            />
          </section>
        </div>

        {/* Progres upload */}
        {loading && (
          <div className="a-panel p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#666660]">
              <span>{stage}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f0f0ec]">
              <div
                className="h-full rounded-full bg-[#f59e0b] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#999991]">
              Jangan tutup halaman ini sampai selesai.
            </p>
          </div>
        )}

        <Notice msg={msg} />

        {doneDramaId && (
          <Link
            href={`/drama/${doneDramaId}`}
            className="a-btn a-btn-line w-full sm:w-auto"
          >
            <ExternalLink size={16} /> Lihat di halaman drama
          </Link>
        )}

        <button className="a-btn a-btn-amber w-full sm:w-auto" disabled={loading}>
          <Upload size={16} />
          {loading ? 'Mengupload...' : 'Upload Klip'}
        </button>
      </form>

      <p className="mt-5 max-w-3xl text-xs leading-5 text-[#999991]">
        Video dikirim langsung dari browser ke R2, jadi ukurannya tidak dibatasi hosting
        (maksimal 2 GB per file). Pastikan CORS bucket R2 sudah mengizinkan alamat web ini.
      </p>
    </div>
  );
}