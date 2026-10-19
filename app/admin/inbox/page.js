'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, ChevronRight } from 'lucide-react';
import { formatDate } from '../../../lib/formatDate';
import Avatar from '../../../components/ui/avatar';
import PageHeader from '../../../components/admin/PageHeader';

export default function AdminInboxPage() {
  const [conversations, setConversations] = useState(null);

  useEffect(() => {
    fetch('/api/admin/inbox')
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []));
  }, []);

  const unreadTotal = (conversations || []).reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <div>
      <PageHeader
        icon={Inbox}
        title="Pesan User"
        subtitle={
          conversations
            ? unreadTotal > 0
              ? `${unreadTotal} pesan belum dibaca`
              : 'Semua pesan sudah dibaca'
            : undefined
        }
      />

      {conversations === null && <p className="text-sm text-[#999991]">Memuat...</p>}

      {conversations?.length === 0 && (
        <div className="a-panel px-5 py-12 text-center">
          <p className="font-bold">Belum ada pesan masuk</p>
          <p className="mt-1 text-sm text-[#777770]">
            Pesan dari user akan muncul di sini.
          </p>
        </div>
      )}

      {conversations?.length > 0 && (
        <div className="a-panel divide-y divide-[#efefea] overflow-hidden lg:max-w-3xl">
          {conversations.map((c) => (
            <Link
              key={c.username}
              href={`/chat/${c.username}`}
              className="flex items-center gap-3 p-3.5 transition hover:bg-[#faf9f6] sm:p-4"
            >
              <Avatar
                size={46}
                src={c.avatar_url}
                alt={c.username}
                className="bg-[#fff4dc] text-[#b45309]"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold">
                    {c.display_name || c.username}
                  </p>
                  <p className="shrink-0 text-[11px] text-[#999991]">
                    {formatDate(c.last_at)}
                  </p>
                </div>

                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-[#777770]">
                    {c.last_message || '(kirim gambar/drama)'}
                  </p>
                  {c.unread > 0 && (
                    <span className="a-pill a-pill-new shrink-0">{c.unread} baru</span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} className="hidden shrink-0 text-[#b0b0a8] sm:block" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}