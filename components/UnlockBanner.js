'use client';
import { useEffect, useState } from 'react';

// Menampilkan banner "masukkan kode dari TikTok" kalau user login tapi belum unlock.
// Begitu benar sekali, tidak akan muncul lagi (downloads_unlocked tersimpan di DB).
export default function UnlockBanner({ onUnlocked }) {
  const [me, setMe] = useState(undefined); // undefined = loading, null = belum login
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    setMe(data.user);
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    await load();
    onUnlocked?.();
  }

  if (me === undefined) return null;

  if (me === null) {
    return (
      <div className="card p-3 text-sm text-muted-foreground">
        <a href="/login" className="text-accent2 font-semibold">Masuk</a> dulu untuk bisa download video.
      </div>
    );
  }

  if (me.downloads_unlocked) return null;

  return (
    <form onSubmit={submit} className="card p-3 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Masukkan kode dari postingan TikTok untuk buka fitur download (cukup sekali):</span>
      <input className="input flex-1 min-w-[140px]" placeholder="Kode" value={code} onChange={(e) => setCode(e.target.value)} />
      <button className="btn-primary" disabled={loading}>{loading ? '...' : 'Buka'}</button>
      {error && <span className="text-red-400 w-full">{error}</span>}
    </form>
  );
}
