'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Save, ImageIcon, ArrowLeft } from 'lucide-react';
import PageHeader from '../../../../../components/admin/PageHeader';
import Notice from '../../../../../components/admin/Notice';
import ActorPicker from '../../../../../components/admin/ActorPicker';
import { uploadImageDirect } from '../../../../../lib/directUpload';

export default function EditDramaPage({ params }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [actors, setActors] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scp_url: '',
    category_id: '',
    subcategory_id: '',
  });
  const [currentPoster, setCurrentPoster] = useState('');
  const [poster, setPoster] = useState(null);
  const [preview, setPreview] = useState('');
  const [selectedActors, setSelectedActors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/actors').then((r) => r.json()),
      fetch(`/api/dramas/${params.id}`).then((r) => r.json()),
    ])
      .then(([cats, acts, dr]) => {
        setCategories(cats.categories || []);
        setActors(acts.actors || []);
        if (dr.drama) {
          setForm({
            title: dr.drama.title || '',
            description: dr.drama.description || '',
            scp_url: dr.drama.scp_url || '',
            category_id: dr.drama.category_id || '',
            subcategory_id: dr.drama.subcategory_id || '',
          });
          setCurrentPoster(dr.drama.poster_url || '');
          setSelectedActors(dr.actor_ids || []);
        } else {
          setMsg(dr.error || 'Drama tidak ditemukan');
        }
      })
      .finally(() => setLoaded(true));
  }, [params.id]);

  useEffect(() => {
    if (!poster) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(poster);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [poster]);

  const activeCategory = categories.find((c) => c.id === form.category_id);

  function toggleActor(id) {
    setSelectedActors((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('scp_url', form.scp_url);
    fd.append('category_id', form.category_id);
    fd.append('subcategory_id', form.subcategory_id);
    fd.append('actor_ids', JSON.stringify(selectedActors));
    if (poster) {
      try {
        fd.append('poster_url', await uploadImageDirect(poster, 'posters'));
      } catch (err) {
        setLoading(false); return setMsg(err.message);
      }
    }

    const res = await fetch(`/api/dramas/${params.id}`, { method: 'PATCH', body: fd });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setMsg(data.error);
    router.push('/admin/dramas');
    router.refresh();
  }

  const shown = preview || currentPoster;

  return (
    <div>
      <PageHeader
        icon={Pencil}
        title="Edit Drama / Film"
        subtitle="Ubah info, kategori, poster, atau aktor"
        action={
          <Link href="/admin/dramas" className="a-btn a-btn-line">
            <ArrowLeft size={16} /> Kembali
          </Link>
        }
      />

      {!loaded && <p className="text-sm text-[#999991]">Memuat...</p>}

      {loaded && (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {/* Kiri: info drama */}
            <section className="a-panel space-y-4 p-4 sm:p-5">
              <div>
                <label className="a-label">Judul</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="a-label">Deskripsi (opsional)</label>
                <textarea
                  className="input min-h-28"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="a-label">Link SCP (opsional)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={form.scp_url}
                  onChange={(e) => setForm((f) => ({ ...f, scp_url: e.target.value }))}
                />
                <p className="mt-1 text-xs text-[#999991]">
                  Kosongkan untuk menghapus link. Tombol &quot;SCP&quot; hanya muncul kalau diisi.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <label className="a-label">Kategori</label>
                  <select
                    className="input"
                    value={form.category_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category_id: e.target.value, subcategory_id: '' }))
                    }
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {activeCategory?.subcategories?.length > 0 && (
                  <div>
                    <label className="a-label">Sub-kategori</label>
                    <select
                      className="input"
                      value={form.subcategory_id}
                      onChange={(e) => setForm((f) => ({ ...f, subcategory_id: e.target.value }))}
                    >
                      <option value="">(tanpa sub-kategori)</option>
                      {activeCategory.subcategories.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* Kanan: poster + aktor */}
            <div className="space-y-5">
              <section className="a-panel p-4 sm:p-5">
                <label className="a-label">Poster</label>

                <div className="flex items-start gap-4">
                  <div className="flex aspect-[2/3] w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f2] text-[#b0b0a8] sm:w-28">
                    {shown ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shown} alt="Poster" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon size={26} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPoster(e.target.files[0] || null)}
                      className="a-file"
                    />
                    <p className="mt-2 text-xs text-[#999991]">
                      Kosongkan kalau tidak mau ganti poster.
                    </p>
                  </div>
                </div>
              </section>

              <section className="a-panel p-4 sm:p-5">
                <ActorPicker actors={actors} selected={selectedActors} onToggle={toggleActor} />
              </section>
            </div>
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