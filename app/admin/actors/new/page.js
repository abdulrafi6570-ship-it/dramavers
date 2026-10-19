'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Save, ImageIcon } from 'lucide-react';
import PageHeader from '../../../../components/admin/PageHeader';
import Notice from '../../../../components/admin/Notice';
import { uploadImageDirect } from '../../../../lib/directUpload';

export default function NewActorPage() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Preview foto yang baru dipilih
  useEffect(() => {
    if (!photo) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData();
    fd.append('name', name);
    fd.append('bio', bio);
    if (photo) {
      try {
        fd.append('photo_url', await uploadImageDirect(photo, 'actors'));
      } catch (err) {
        setLoading(false); return setMsg(err.message);
      }
    }

    const res = await fetch('/api/actors', { method: 'POST', body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(data.error);
    setName('');
    setBio('');
    setPhoto(null);
    setFileKey((k) => k + 1);
    setMsg('Aktor "' + data.actor.name + '" berhasil ditambahkan ✓');
  }

  return (
    <div>
      <PageHeader
        icon={UserPlus}
        title="Tambah Aktor"
        subtitle="Aktor bisa di-tag ke drama dan klip"
      />

      <form onSubmit={submit} className="space-y-5">
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
          {/* Data aktor */}
          <section className="a-panel space-y-4 p-4 sm:p-5">
            <div>
              <label className="a-label">Nama aktor</label>
              <input
                className="input"
                placeholder="Nama aktor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="a-label">Bio singkat (opsional)</label>
              <textarea
                className="input min-h-28"
                placeholder="Bio singkat"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </section>

          {/* Foto aktor */}
          <section className="a-panel space-y-4 p-4 sm:p-5">
            <div>
              <label className="a-label">Foto aktor</label>

              <div className="mx-auto mb-3 flex aspect-square w-40 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f2] text-[#b0b0a8] lg:w-full">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview foto" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={32} />
                )}
              </div>

              <input
                key={fileKey}
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0] || null)}
                className="a-file"
              />
            </div>
          </section>
        </div>

        <Notice msg={msg} />

        <button className="a-btn a-btn-amber w-full sm:w-auto sm:min-w-44" disabled={loading}>
          <Save size={16} />
          {loading ? 'Menyimpan...' : 'Simpan Aktor'}
        </button>
      </form>
    </div>
  );
}