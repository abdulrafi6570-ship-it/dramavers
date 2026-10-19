'use client';
import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { formatDate } from '../lib/formatDate';
import Avatar from './ui/avatar';
import Button from './ui/button';

export default function ClipComments({ clipId, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  function load() {
    fetch(`/api/clips/${clipId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        setComments(d.comments || []);
        onCountChange?.(d.comments?.length || 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [clipId]);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/clips/${clipId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });
    setSending(false);
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (res.ok) {
      setText('');
      load();
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-border bg-card/60 p-3">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis komentar..."
          className="input"
        />
        <Button size="icon" type="submit" disabled={sending}>
          <Send size={15} />
        </Button>
      </form>

      {loading ? (
        <p className="text-xs text-muted-foreground">Memuat komentar...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada komentar.</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-none">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar size={28} src={c.users?.avatar_url} alt={c.users?.username} />
              <div className="min-w-0">
                <p className="text-xs">
                  <span className="font-semibold">@{c.users?.username || 'user'}</span>{' '}
                  <span className="text-muted-foreground">{formatDate(c.created_at)}</span>
                </p>
                <p className="text-sm break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
