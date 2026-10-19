'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Save, ImageIcon, ArrowLeft } from 'lucide-react';
import PageHeader from '../../../../../components/admin/PageHeader';
import Notice from '../../../../../components/admin/Notice';
import { uploadImageDirect } from '../../../../../lib/directUpload';

export default function EditActorPage({ params }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/actors/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.actor) {
          setName(d.actor.name || '');
          setBio(d.actor.bio || '');
          setCurrentPhoto(d.actor.photo_url || '');
        } else {
          setMsg(d.error || 'Aktor tidak ditemukan');
        }
      })
      .finally(() => setLoaded(true));
  }, [params.id]);

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

    const res = await fetch(`/api/actors/${params.id}`, { method: 'PATCH', body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(data.error);
    router.push('/admin/actors');
    router.refresh();
  }

  const shown = preview || currentPhoto;

  return (
    <div>
      <PageHeader
        icon={Pencil}
        title="Edit Aktor"
        subtitle="Ubah nama, bio, atau foto"
        action={
          <Link href="/admin/actors" className="a-btn a-btn-line">
            <ArrowLeft size={16} /> Kembali
          </Link>
        }
      />

      {!loaded && <p className="text-sm text-[#999991]">Memuat...</p>}

      {loaded && (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
            <section className="a-panel space-y-4 p-4 sm:p-5">
              <div>
                <label className="a-label">Nama aktor</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label className="a-label">Bio singkat (opsional)</label>
                <textarea className="input min-h-28" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
            </section>

            <section className="a-panel space-y-4 p-4 sm:p-5">
              <div>
                <label className="a-label">Foto aktor</label>

                <div className="mx-auto mb-3 flex aspect-square w-40 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f5f2] text-[#b0b0a8] lg:w-full">
                  {shown ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shown} alt="Foto aktor" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon size={32} />
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0] || null)}
                  className="a-file"
                />
                <p className="mt-2 text-xs text-[#999991]">Kosongkan kalau tidak mau ganti foto.</p>
              </div>
            </section>
          </div>

          <Notice msg={msg} />

          <button className="a-btn a-btn-amber w-full sm:w-auto sm:min-w-44" disabled={loading}>
            <Save size={16} />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      )}
    </div>
  );
}