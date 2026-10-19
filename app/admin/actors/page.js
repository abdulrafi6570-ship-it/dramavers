'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Pencil, Trash2, Plus, Search } from 'lucide-react';
import PageHeader from '../../../components/admin/PageHeader';
import Notice from '../../../components/admin/Notice';
import Avatar from '../../../components/ui/avatar';

export default function AdminActorsPage() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    setLoading(true);
    fetch('/api/actors')
      .then((r) => r.json())
      .then((d) => setActors(d.actors || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function hapus(a) {
    if (!confirm(`Hapus aktor "${a.name}"?\n\nTag aktor ini di drama & klip ikut hilang (dramanya tetap ada).`)) return;
    setMsg('');
    const res = await fetch(`/api/actors/${a.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setMsg(`Aktor "${a.name}" dihapus ✓`);
    load();
  }

  const list = actors.filter((a) => a.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title="Kelola Aktor"
        subtitle={`${actors.length} aktor`}
        action={
          <Link href="/admin/actors/new" className="a-btn a-btn-amber">
            <Plus size={16} /> Tambah Aktor
          </Link>
        }
      />

      <Notice msg={msg} />

      {actors.length > 6 && (
        <div className="relative lg:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999991]" />
          <input
            className="input !pl-9"
            placeholder="Cari aktor..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}

      {loading && <p className="text-sm text-[#999991]">Memuat...</p>}

      {!loading && actors.length === 0 && (
        <div className="a-panel px-5 py-12 text-center">
          <p className="font-bold">Belum ada aktor</p>
          <p className="mt-1 text-sm text-[#777770]">Tambahkan aktor pertama lewat tombol di atas.</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => (
          <div key={a.id} className="a-panel flex items-center gap-3 p-3 sm:p-4">
            <Avatar size={48} src={a.photo_url} alt={a.name} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{a.name}</p>
              <p className="truncate text-xs text-[#777770]">{a.bio || 'Tanpa bio'}</p>
            </div>

            <Link
              href={`/admin/actors/${a.id}/edit`}
              className="a-btn a-btn-line a-btn-sm shrink-0"
              aria-label="Edit aktor"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Edit</span>
            </Link>

            <button
              type="button"
              onClick={() => hapus(a)}
              className="a-btn a-btn-danger a-btn-sm shrink-0"
              aria-label="Hapus aktor"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>
        ))}
      </div>

      {!loading && actors.length > 0 && list.length === 0 && (
        <p className="text-sm text-[#999991]">Aktor tidak ditemukan.</p>
      )}
    </div>
  );
}