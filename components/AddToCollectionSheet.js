'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Check, FolderPlus } from 'lucide-react';
import Button from './ui/button';

export default function AddToCollectionSheet({ clipId, onClose }) {
  const [collections, setCollections] = useState(null);
  const [memberIds, setMemberIds] = useState(new Set());
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/collections?clipId=${clipId}`)
      .then((r) => (r.status === 401 ? (window.location.href = '/login') : r.json()))
      .then((d) => {
        if (!d) return;
        setCollections(d.collections || []);
        setMemberIds(new Set((d.collections || []).filter((c) => c.is_member).map((c) => c.id)));
      });
  }, [clipId]);

  async function toggle(collectionId, isMember) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      isMember ? next.delete(collectionId) : next.add(collectionId);
      return next;
    });
    await fetch(`/api/collections/${collectionId}/clips/${clipId}`, {
      method: isMember ? 'DELETE' : 'POST',
    });
  }

  async function createCollection(e) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const d = await res.json();
    setCreating(false);
    if (res.ok) {
      setCollections((c) => [d.collection, ...(c || [])]);
      setNewName('');
      toggle(d.collection.id, false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-4 space-y-3 animate-slide-up max-h-[75vh] overflow-y-auto scrollbar-none"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><FolderPlus size={16} className="text-primary" /> Simpan ke koleksi</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <form onSubmit={createCollection} className="flex gap-2">
          <input
            className="input"
            placeholder="Buat koleksi baru..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button size="icon" type="submit" disabled={creating}><Plus size={16} /></Button>
        </form>

        <div className="space-y-1.5">
          {collections === null && <p className="text-xs text-muted-foreground">Memuat koleksi...</p>}
          {collections?.length === 0 && <p className="text-xs text-muted-foreground">Belum ada koleksi. Buat dulu di atas.</p>}
          {collections?.map((c) => {
            const isMember = memberIds.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id, isMember)}
                className="w-full flex items-center justify-between rounded-xl border border-border px-3 py-2.5 hover:border-primary/60 transition text-left"
              >
                <span className="text-sm font-medium truncate">{c.name} <span className="text-muted-foreground font-normal">· {c.clip_count}</span></span>
                {isMember && <Check size={16} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
