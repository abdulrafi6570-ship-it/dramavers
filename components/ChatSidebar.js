'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import Avatar from './ui/avatar';
import { formatTime } from '../lib/formatDate';

export default function ChatSidebar() {
  const [contacts, setContacts] = useState([]);
  const pathname = usePathname();

  async function load() {
    const res = await fetch('/api/chat/contacts');
    if (!res.ok) return;
    const data = await res.json();
    setContacts(data.contacts || []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border font-semibold shrink-0">Komunitas</div>
      <div className="flex-1 overflow-y-auto">
        <Link
          href="/chat/global"
          className={`flex items-center gap-3 p-3 hover:bg-secondary/50 transition border-b border-border/60 ${
            pathname === '/chat/global' ? 'bg-secondary/60' : ''
          }`}
        >
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Globe size={18} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Chat Global</p>
            <p className="text-xs text-muted-foreground truncate">Obrolan semua orang</p>
          </div>
        </Link>

        {contacts.map((c) => {
          const active = pathname === `/chat/${c.username}`;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.username}`}
              className={`flex items-center gap-3 p-3 hover:bg-secondary/50 transition border-b border-border/60 ${
                active ? 'bg-secondary/60' : ''
              }`}
            >
              <Avatar size={40} src={c.avatar_url} alt={c.username} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.display_name || c.username}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.mine ? 'Kamu: ' : ''}
                  {c.last_content || '...'}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(c.last_at)}</span>
            </Link>
          );
        })}

        {contacts.length === 0 && (
          <p className="text-xs text-muted-foreground p-3">
            Belum ada chat pribadi. Buka profil seseorang lalu tekan &quot;Chat&quot;.
          </p>
        )}
      </div>
    </div>
  );
}