'use client';
import { useEffect, useState } from 'react';
import Avatar from './ui/avatar';

export default function ShareToChat({ dramaId, dramaTitle }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState(null);
  const [sendingTo, setSendingTo] = useState(null);
  const [doneTo, setDoneTo] = useState(null);

  useEffect(() => {
    if (open && contacts === null) {
      fetch('/api/chat/contacts')
        .then((r) => r.json())
        .then((d) => setContacts(d.contacts || []));
    }
  }, [open, contacts]);

  async function share(username) {
    setSendingTo(username);
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_username: username,
        content: '',
        shared_drama_id: dramaId,
      }),
    });
    setSendingTo(null);
    setDoneTo(username);
    setTimeout(() => {
      setOpen(false);
      setDoneTo(null);
    }, 1000);
  }

  return (
    <div className="relative">
      <button className="card px-3 py-2 text-sm" onClick={() => setOpen((v) => !v)}>
        Share ke chat
      </button>
      {open && (
        <div className="absolute z-10 mt-2 card p-3 w-72 space-y-2">
          <p className="text-xs text-muted-foreground">Kirim &quot;{dramaTitle}&quot; ke:</p>

          {contacts === null && <p className="text-xs text-muted-foreground py-2">Memuat...</p>}

          {contacts && contacts.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              Kamu belum pernah chat pribadi sama siapa-siapa. Buka profil seseorang, tekan tombol &quot;Chat&quot;, kirim pesan dulu — abis itu baru bisa muncul di sini.
            </p>
          )}

          {contacts && contacts.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => share(c.username)}
                  disabled={sendingTo === c.username}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/60 transition text-left disabled:opacity-60"
                >
                  <Avatar size={28} src={c.avatar_url} alt={c.username} />
                  <span className="text-sm flex-1 truncate">{c.display_name || c.username}</span>
                  {doneTo === c.username && <span className="text-xs text-primary shrink-0">Terkirim ✓</span>}
                  {sendingTo === c.username && <span className="text-xs text-muted-foreground shrink-0">...</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}