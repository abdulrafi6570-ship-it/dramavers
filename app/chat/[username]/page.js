'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatTime, groupMessagesByDay } from '../../../lib/formatDate';
import SharedDramaCard from '../../../components/SharedDramaCard';

export default function PrivateChatPage({ params }) {
  const [messages, setMessages] = useState([]);
  const [other, setOther] = useState(null);
  const [me, setMe] = useState(undefined);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  async function load() {
    const res = await fetch(`/api/chat/${params.username}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setMessages(data.messages || []);
    setOther(data.other);
  }

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      setMe(d.user);
      if (d.user?.role === 'admin') {
        fetch(`/api/admin/messages/${params.username}/read`, { method: 'POST' }).catch(() => {});
      }
    });
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setText('');
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_username: params.username, content: text }),
    });
    load();
  }

  if (error) return <p className="text-red-400">{error}</p>;

  const groups = groupMessagesByDay(messages);

   return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border font-semibold flex items-center gap-2 shrink-0">
        <Link href={`/profile/${params.username}`} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
            {other?.avatar_url && <img src={other.avatar_url} alt={other.username} className="w-full h-full object-cover" />}
          </div>
          <span>{other?.display_name || params.username}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {groups.map((g, gi) => (
          <div key={gi}>
            <div className="text-center text-xs text-muted-foreground my-2">{g.day}</div>
            {g.messages.map((m) => {
              const mine = m.sender_id === me?.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`max-w-[75%] ${mine ? 'bg-accent/20' : 'bg-muted'} rounded-xl px-3 py-2`}>
                    {m.content && <p className="text-sm">{m.content}</p>}
                    <SharedDramaCard drama={m.drama} />
                    <p className="text-[10px] text-muted-foreground text-right mt-1">{formatTime(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
        {messages.length === 0 && <p className="text-muted-foreground text-sm text-center">Belum ada pesan, mulai ngobrol yuk.</p>}
      </div>

            <form onSubmit={send} className="p-3 border-t border-border flex gap-2 shrink-0">
        <input className="input" placeholder="Ketik pesan..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn-primary shrink-0">Kirim</button>
      </form>
    </div>
  );
}
