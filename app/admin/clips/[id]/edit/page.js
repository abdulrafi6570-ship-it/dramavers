'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Save } from 'lucide-react';
import PageHeader from '../../../../../components/admin/PageHeader';
import Notice from '../../../../../components/admin/Notice';
import ActorPicker from '../../../../../components/admin/ActorPicker';

export default function EditClipPage() {
  const { id } = useParams();
  const router = useRouter();

  const [actors, setActors] = useState([]);
  const [title, setTitle] = useState('');
  const [dramaTitle, setDramaTitle] = useState('');
  const [selectedActors, setSelectedActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/clips/${id}`).then((r) => r.json()),
      fetch('/api/actors').then((r) => r.json()),
    ]).then(([clipData, actorsData]) => {
      if (clipData.clip) {
        setTitle(clipData.clip.title || '');
        setDramaTitle(clipData.clip.dramas?.title || '');
        setSelectedActors(clipData.actor_ids || []);
      } else {
        setMsg(clipData.error || 'Klip tidak ditemukan');
      }
      setActors(actorsData.actors || []);
      setLoading(false);
    });
  }, [id]);

  function toggleActor(aid) {
    setSelectedActors((s) => (s.includes(aid) ? s.filter((x) => x !== aid) : [...s, aid]));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch(`/api/clips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, actor_ids: selectedActors }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg(data.error || 'Gagal menyimpan');
    router.push('/admin/clips');
  }

  if (loading) return <p className="text-sm text-[#999991]">Memuat...</p>;

  return (
    <div>
      <PageHeader
        icon={Pencil}
        title="Edit Klip"
        subtitle={dramaTitle ? `dari drama: ${dramaTitle}` : undefined}
      />

      <form onSubmit={submit} className="space-y-5">
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="a-panel p-4 sm:p-5">
            <label className="a-label">Judul klip (opsional)</label>
            <input
              className="input"
              placeholder="Judul klip"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </section>

          <section className="a-panel p-4 sm:p-5">
            <ActorPicker
              actors={actors}
              selected={selectedActors}
              onToggle={toggleActor}
              label="Tag aktor di klip ini"
            />
          </section>
        </div>

        <Notice msg={msg} />

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link href="/admin/clips" className="a-btn a-btn-line">
            Batal
          </Link>

          <button className="a-btn a-btn-amber sm:min-w-44" disabled={saving}>
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}