'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clapperboard, Pencil, Trash2, Plus } from 'lucide-react';
import { formatDate } from '../../../lib/formatDate';
import PageHeader from '../../../components/admin/PageHeader';

export default function AdminClipsPage() {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch('/api/clips')
      .then((r) => r.json())
      .then((d) => setClips(d.clips || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function hapus(id) {
    if (!confirm('Yakin hapus klip ini?')) return;
    await fetch(`/api/clips/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <PageHeader
        icon={Clapperboard}
        title="Kelola Klip"
        subtitle={`${clips.length} klip`}
        action={
          <Link href="/admin/clips/new" className="a-btn a-btn-amber">
            <Plus size={16} /> Upload Klip
          </Link>
        }
      />

      {loading && <p className="text-sm text-[#999991]">Memuat...</p>}

      {!loading && clips.length === 0 && (
        <div className="a-panel px-5 py-12 text-center">
          <p className="font-bold">Belum ada klip</p>
          <p className="mt-1 text-sm text-[#777770]">
            Upload klip pertamamu lewat tombol di atas.
          </p>
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-2">
        {clips.map((c) => (
          <div key={c.id} className="a-panel flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f2] text-[#55554f]">
              <Clapperboard size={18} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {c.title || '(tanpa judul)'}
              </p>
              <p className="truncate text-xs text-[#777770]">
                {c.dramas?.title ? `dari ${c.dramas.title}` : 'drama tidak ditemukan'}
                {c.created_at ? ` · ${formatDate(c.created_at)}` : ''}
              </p>
            </div>

            <Link
              href={`/admin/clips/${c.id}/edit`}
              className="a-btn a-btn-line a-btn-sm shrink-0"
              aria-label="Edit klip"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Edit</span>
            </Link>

            <button
              type="button"
              onClick={() => hapus(c.id)}
              className="a-btn a-btn-danger a-btn-sm shrink-0"
              aria-label="Hapus klip"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}