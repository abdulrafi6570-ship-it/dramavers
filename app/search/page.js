'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// 3 kolom di HP, makin banyak di layar lebar
const GRID = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3';

function PosterGrid({ items }) {
  return (
    <div className={GRID}>
      {items.map((d) => (
        <Link key={d.id} href={`/drama/${d.id}`} className="card overflow-hidden group">
          <div className="aspect-[2/3] bg-muted overflow-hidden">
            {d.poster_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.poster_url}
                alt={d.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            )}
          </div>
          <div className="p-1.5 sm:p-2">
            <p className="text-xs sm:text-sm font-medium truncate">{d.title}</p>
            {d.categories?.name && (
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{d.categories.name}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [dramas, setDramas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followState, setFollowState] = useState({});
  const [error, setError] = useState('');
  const [latest, setLatest] = useState([]); // poster yang tampil sebelum user mengetik
  const [latestLoading, setLatestLoading] = useState(true);

  // Fokus otomatis hanya di PC (di HP keyboard akan menutupi poster)
  useEffect(() => {
    if (window.matchMedia('(hover: hover)').matches) inputRef.current?.focus();
  }, []);

  // Ambil poster terbaru sekali saat halaman dibuka
  useEffect(() => {
    fetch('/api/dramas/search')
      .then((r) => r.json())
      .then((d) => setLatest(d.dramas || []))
      .catch(() => {})
      .finally(() => setLatestLoading(false));
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setUsers([]);
      setDramas([]);
      setCategories([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      setError('');
      const [userRes, dramaRes] = await Promise.all([
        fetch(`/api/users/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
        fetch(`/api/dramas/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
      ]);
      setUsers(userRes.users || []);
      setDramas(dramaRes.dramas || []);
      setCategories(dramaRes.categories || []);
      setSearched(true);
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [q]);

  async function follow(username) {
    setError('');
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Gagal follow user ini');
      return;
    }
    setFollowState((prev) => ({ ...prev, [username]: data.following }));
  }

  const nothingFound = searched && !loading && users.length === 0 && dramas.length === 0 && categories.length === 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-2xl font-bold">Cari</h1>
      <input
        ref={inputRef}
        className="input"
        placeholder="Cari user, judul drama/film, atau kategori..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-muted-foreground text-sm">Mencari...</p>}
      {nothingFound && <p className="text-muted-foreground text-sm">Tidak ada hasil untuk "{q}".</p>}

      {/* Poster terbaru: tampil hanya saat kolom cari kosong. Klik poster -> halaman drama (video) */}
      {!q.trim() && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Drama & Film Terbaru</h2>
          {latestLoading && <p className="text-muted-foreground text-sm">Memuat...</p>}
          <PosterGrid items={latest} />
        </div>
      )}

      {categories.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Kategori</h2>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="card px-4 py-2 text-sm font-semibold hover:border-primary/60 transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {dramas.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Drama & Film</h2>
          <PosterGrid items={dramas} />
        </div>
      )}

      {users.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">User</h2>
          <div className="space-y-2">
            {users.map((u) => {
              const isFollowing = followState[u.username];
              return (
                <div key={u.username} className="card p-3 flex items-center gap-3">
                  <Link href={`/profile/${u.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                      {u.avatar_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {u.display_name} {u.role === 'admin' && <span className="text-xs text-accent2">· admin</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </Link>
                  <button className="card px-2 py-1 text-xs shrink-0" onClick={() => follow(u.username)}>
                    {isFollowing ? 'Mengikuti' : 'Follow'}
                  </button>
                  <Link href={`/chat/${u.username}`} className="card px-2 py-1 text-xs shrink-0">
                    Chat
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}