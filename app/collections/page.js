'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderHeart, Play } from 'lucide-react';
import Button from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function CollectionsPage() {
  const [collections, setCollections] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    fetch('/api/collections')
      .then((r) => (r.status === 401 ? (window.location.href = '/login') : r.json()))
      .then((d) => d && setCollections(d.collections || []));
  }
  useEffect(load, []);

  async function createCollection(e) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (res.ok) {
      setNewName('');
      load();
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <FolderHeart size={18} className="text-primary" />
        <h1 className="text-xl font-bold">Koleksi Kamu</h1>
      </div>

      <form onSubmit={createCollection} className="flex gap-2">
        <input className="input" placeholder="Nama koleksi baru..." value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" disabled={creating}><Plus size={16} /> Buat</Button>
      </form>

      {collections === null && <p className="text-sm text-muted-foreground">Memuat...</p>}
      {collections?.length === 0 && <p className="text-sm text-muted-foreground">Belum ada koleksi. Simpan klip favoritmu ke koleksi lewat tombol folder di bawah video.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {collections?.map((c) => (
          <Link key={c.id} href={`/collections/${c.id}`}>
            <Card className="overflow-hidden group">
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                {c.cover_url ? (
                  <video src={c.cover_url} className="h-full w-full object-cover" muted />
                ) : (
                  <Play size={22} className="text-muted-foreground" />
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.clip_count} klip</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
