'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatTime, groupMessagesByDay } from '../../../lib/formatDate';
import SharedDramaCard from '../../../components/SharedDramaCard';

export default function GlobalChatPage() {
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(undefined);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  async function load() {
    const res = await fetch('/api/chat/global', { cache: 'no-store' });
    const data = await res.json();
    setMessages(data.messages || []);
  }

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setMe(d.user));
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

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
      body: JSON.stringify({ content: text }),
    });
    load();
  }

  const groups = groupMessagesByDay(messages);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border font-semibold shrink-0">Chat Global</div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {groups.map((g, gi) => (
          <div key={gi}>
            <div className="text-center text-xs text-muted-foreground my-2">{g.day}</div>
            {g.messages.map((m) => {
              const mine = m.sender?.username === me?.username;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`max-w-[75%] ${mine ? 'bg-accent/20' : 'bg-muted'} rounded-xl px-3 py-2`}>
                    {!mine && (
                      <Link href={`/profile/${m.sender?.username}`} className="text-xs font-semibold text-accent2 block">
                        {m.sender?.display_name || m.sender?.username}
                        {m.sender?.role === 'admin' && ' · admin'}
                      </Link>
                    )}
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
        {messages.length === 0 && <p className="text-muted-foreground text-sm text-center">Belum ada pesan.</p>}
      </div>

      {me ? (
        <form onSubmit={send} className="p-3 border-t border-border flex gap-2 shrink-0">
          <input className="input" placeholder="Ketik pesan..." value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-primary shrink-0">Kirim</button>
        </form>
      ) : (
        <div className="p-3 border-t border-border text-sm text-muted-foreground shrink-0">
          <Link href="/login" className="text-accent2">Masuk</Link> untuk ikut chat.
        </div>
      )}
    </div>
  );
}