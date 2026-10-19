'use client';
import { useEffect, useState } from 'react';
import { ListPlus, ArrowBigUp, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function RequestsPage() {
  const [requests, setRequests] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ drama: '', actor: '', scene: '', episode: '' });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch('/api/requests').then((r) => r.json()).then((d) => setRequests(d.requests || []));
  }
  useEffect(load, []);

  async function vote(id, currentlyVoted) {
    setRequests((rs) =>
      rs.map((r) => (r.id === id ? { ...r, voted: !currentlyVoted, votes: r.votes + (currentlyVoted ? -1 : 1) } : r))
    );
    const res = await fetch(`/api/requests/${id}/vote`, { method: 'POST' });
    if (res.status === 401) window.location.href = '/login';
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.drama.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.status === 401) return (window.location.href = '/login');
    if (res.ok) {
      setForm({ drama: '', actor: '', scene: '', episode: '' });
      setShowForm(false);
      load();
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListPlus size={18} className="text-primary" />
          <h1 className="text-xl font-bold">Request Klip</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Request</Button>
      </div>
      <p className="text-sm text-muted-foreground -mt-3">Minta drama/scene yang belum ada, dan vote request orang lain biar diprioritaskan.</p>

      {showForm && (
        <form onSubmit={submit} className="card p-4 space-y-2.5">
          <input className="input" placeholder="Judul drama / film *" value={form.drama} onChange={(e) => setForm({ ...form, drama: e.target.value })} required />
          <input className="input" placeholder="Nama aktor (opsional)" value={form.actor} onChange={(e) => setForm({ ...form, actor: e.target.value })} />
          <input className="input" placeholder="Scene / momen spesifik (opsional)" value={form.scene} onChange={(e) => setForm({ ...form, scene: e.target.value })} />
          <input className="input" placeholder="Episode (opsional)" value={form.episode} onChange={(e) => setForm({ ...form, episode: e.target.value })} />
          <Button type="submit" disabled={submitting} className="w-full">{submitting ? 'Mengirim...' : 'Kirim Request'}</Button>
        </form>
      )}

      <div className="space-y-2.5">
        {requests === null && <p className="text-sm text-muted-foreground">Memuat...</p>}
        {requests?.map((r) => (
          <Card key={r.id} className="p-3.5 flex gap-3 items-start">
            <button
              onClick={() => vote(r.id, r.voted)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2 shrink-0 transition',
                r.voted ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:border-primary/60'
              )}
            >
              <ArrowBigUp size={16} className={r.voted ? 'fill-primary' : ''} />
              <span className="text-xs font-bold">{r.votes}</span>
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{r.drama}</p>
              <p className="text-xs text-muted-foreground">
                {[r.actor, r.scene && `scene: ${r.scene}`, r.episode && `ep ${r.episode}`].filter(Boolean).join(' · ') || 'Tidak ada detail tambahan'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">diminta oleh @{r.users?.username || 'user'}</p>
            </div>
          </Card>
        ))}
        {requests?.length === 0 && <p className="text-sm text-muted-foreground">Belum ada request. Jadi yang pertama!</p>}
      </div>
    </div>
  );
}
