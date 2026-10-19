'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import ClipCard from '../../../components/ClipCard';
import Button from '../../../components/ui/button';

export default function CollectionDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();

  function load() {
    fetch(`/api/collections/${params.id}`)
      .then((r) => (r.status === 401 ? (window.location.href = '/login') : r.json()))
      .then((d) => {
        if (!d) return;
        if (d.error) return router.push('/collections');
        setData(d);
        setName(d.collection.name);
      });
  }
  useEffect(load, [params.id]);

  async function rename(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch(`/api/collections/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    setEditing(false);
    load();
  }

  async function remove() {
    if (!confirm('Hapus koleksi ini?')) return;
    await fetch(`/api/collections/${params.id}`, { method: 'DELETE' });
    router.push('/collections');
  }

  if (!data) return <p className="text-muted-foreground">Memuat...</p>;

  return (
    <div className="space-y-5 animate-fade-in">
      <Button as="span" variant="ghost" size="sm" onClick={() => router.push('/collections')} className="cursor-pointer">
        <ArrowLeft size={16} /> Koleksi
      </Button>

      <div className="flex items-center justify-between gap-3">
        {editing ? (
          <form onSubmit={rename} className="flex gap-2 flex-1">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <Button size="sm" type="submit">Simpan</Button>
          </form>
        ) : (
          <h1 className="text-xl font-bold truncate">{data.collection.name}</h1>
        )}
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setEditing((v) => !v)}><Pencil size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={remove}><Trash2 size={16} className="text-destructive" /></Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {data.clips.map((c) => <ClipCard key={c.id} clip={c} />)}
        {data.clips.length === 0 && <p className="text-sm text-muted-foreground">Belum ada klip di koleksi ini.</p>}
      </div>
    </div>
  );
}
