'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, Pencil, Trash2, Plus, Search, ImageIcon } from 'lucide-react';
import PageHeader from '../../../components/admin/PageHeader';
import Notice from '../../../components/admin/Notice';

export default function AdminDramasPage() {
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    setLoading(true);
    fetch('/api/dramas')
      .then((r) => r.json())
      .then((d) => setDramas(d.dramas || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function hapus(d) {
    if (!confirm(`Hapus drama "${d.title}"?\n\nSEMUA klip di dalamnya ikut terhapus. Tindakan ini tidak bisa dibatalkan.`)) return;
    setMsg('');
    const res = await fetch(`/api/dramas/${d.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setMsg(`Drama "${d.title}" dihapus ✓`);
    load();
  }

  const list = dramas.filter((d) => d.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Film}
        title="Kelola Drama"
        subtitle={`${dramas.length} drama / film`}
        action={
          <Link href="/admin/dramas/new" className="a-btn a-btn-amber">
            <Plus size={16} /> Tambah Drama
          </Link>
        }
      />

      <Notice msg={msg} />

      {dramas.length > 6 && (
        <div className="relative lg:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999991]" />
          <input
            className="input !pl-9"
            placeholder="Cari judul..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}

      {loading && <p className="text-sm text-[#999991]">Memuat...</p>}

      {!loading && dramas.length === 0 && (
        <div className="a-panel px-5 py-12 text-center">
          <p className="font-bold">Belum ada drama</p>
          <p className="mt-1 text-sm text-[#777770]">Tambahkan drama pertama lewat tombol di atas.</p>
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-2">
        {list.map((d) => (
          <div key={d.id} className="a-panel flex items-center gap-3 p-3 sm:p-4">
            <div className="flex aspect-[2/3] w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f5f5f2] text-[#b0b0a8]">
              {d.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.poster_url} alt={d.title} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={16} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{d.title}</p>
              <p className="truncate text-xs text-[#777770]">
                {d.categories?.name || 'Tanpa kategori'}
                {d.scp_url ? ' · ada link SCP' : ''}
              </p>
            </div>

            <Link
              href={`/admin/dramas/${d.id}/edit`}
              className="a-btn a-btn-line a-btn-sm shrink-0"
              aria-label="Edit drama"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Edit</span>
            </Link>

            <button
              type="button"
              onClick={() => hapus(d)}
              className="a-btn a-btn-danger a-btn-sm shrink-0"
              aria-label="Hapus drama"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>
        ))}
      </div>

      {!loading && dramas.length > 0 && list.length === 0 && (
        <p className="text-sm text-[#999991]">Drama tidak ditemukan.</p>
      )}
    </div>
  );
}