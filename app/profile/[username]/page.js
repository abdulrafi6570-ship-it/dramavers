'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderHeart, History, Trophy, Heart, ListPlus, ChevronRight, Flame } from 'lucide-react';
import Avatar from '../../../components/ui/avatar';
import { Card } from '../../../components/ui/card';
import BadgeGrid, { computeBadges } from '../../../components/BadgeGrid';
import { uploadImageDirect } from '../../../lib/directUpload';

export default function ProfilePage({ params }) {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', bio: '', username: '' });
  const [avatar, setAvatar] = useState(null);
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function load() {
    const res = await fetch(`/api/users/${params.username}`);
    const d = await res.json();
    if (res.ok) {
      setData(d);
      setForm({ display_name: d.user.display_name, bio: d.user.bio || '', username: d.user.username });
    }
  }
  useEffect(() => { load(); }, [params.username]);

  async function toggleFollow() {
    await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: params.username }),
    });
    load();
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMsg('');
    const fd = new FormData();
    fd.append('display_name', form.display_name);
    fd.append('bio', form.bio);
    if (form.username !== data.user.username) fd.append('username', form.username);
    if (avatar) {
      try {
        fd.append('avatar_url', await uploadImageDirect(avatar, 'avatars'));
      } catch (err) {
        return setMsg(err.message);
      }
    }

    const res = await fetch(`/api/users/${data.user.username}`, { method: 'PATCH', body: fd });
    const d = await res.json();
    if (!res.ok) return setMsg(d.error);
    setEditing(false);
    if (d.user.username !== params.username) {
      router.push(`/profile/${d.user.username}`);
    } else {
      load();
    }
  }

  if (!data) return <p className="text-muted-foreground">Memuat...</p>;
  const { user, followers, following, isSelf, isFollowing, stats } = data;
  const badges = stats ? computeBadges(stats) : [];

  return (
    <div className="w-full animate-fade-in grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 items-start">
      {/* ===== Kolom kiri (PC): profil, streak, tombol ===== */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="card p-4 sm:p-5 flex gap-3 sm:gap-4 items-center lg:flex-col lg:text-center">
          <Avatar size={80} src={user.avatar_url} alt={user.username} />
          <div className="flex-1 min-w-0 lg:w-full">
            <div className="flex items-center gap-2 flex-wrap lg:justify-center">
              <h1 className="text-lg sm:text-xl font-bold truncate">{user.display_name}</h1>
              {user.role === 'admin' && <span className="text-xs bg-accent2/20 text-accent2 px-2 py-0.5 rounded-full">admin</span>}
            </div>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
            <p className="text-sm text-muted-foreground mt-1">{followers} pengikut · {following} mengikuti</p>
          </div>
        </div>

        {user.bio && <p className="text-sm text-muted-foreground lg:text-center">{user.bio}</p>}

        {stats && (
          <Card className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Flame size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold leading-tight">
                {stats.currentStreak} hari beruntun
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.currentStreak > 0
                  ? 'Buka lagi besok biar streak-nya lanjut.'
                  : 'Buka DramaVers tiap hari buat mulai streak-mu.'}
              </p>
            </div>
          </Card>
        )}

        {isSelf ? (
          <button className="card px-4 py-2 text-sm w-full" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Batal' : 'Edit Profil'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={toggleFollow} className={`${isFollowing ? 'card px-4 py-2 text-sm' : 'btn-primary text-sm'} flex-1`}>
              {isFollowing ? 'Mengikuti' : 'Follow'}
            </button>
            <Link href={`/chat/${user.username}`} className="card px-4 py-2 text-sm text-center flex-1">Chat</Link>
          </div>
        )}
      </aside>

      {/* ===== Kolom kanan (PC): form edit, pencapaian, menu ===== */}
      <section className="space-y-4 min-w-0">
        {isSelf && editing && (
          <form onSubmit={saveProfile} className="card p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nama tampilan (bebas kapan saja)</label>
              <input className="input" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Bio</label>
              <textarea className="input" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Username (ganti maksimal tiap 3 hari)</label>
              <input className="input" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Foto profil</label>
              <input type="file" accept="image/*" className="block text-sm mt-1" onChange={(e) => setAvatar(e.target.files[0])} />
            </div>
            {msg && <p className="text-red-400 text-sm">{msg}</p>}
            <button className="btn-primary">Simpan</button>
          </form>
        )}

        {badges.length > 0 && <BadgeGrid badges={badges} />}

        {isSelf && (
          <div className="card divide-y divide-border overflow-hidden">
            <Link href="/collections" className="flex items-center gap-3 p-3.5 hover:bg-secondary/50 transition">
              <FolderHeart size={17} className="text-primary" />
              <span className="text-sm flex-1">Koleksi Kamu</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
            <Link href="/watch-history" className="flex items-center gap-3 p-3.5 hover:bg-secondary/50 transition">
              <History size={17} className="text-primary" />
              <span className="text-sm flex-1">Riwayat Tontonan</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
            <Link href="/leaderboard" className="flex items-center gap-3 p-3.5 hover:bg-secondary/50 transition">
              <Trophy size={17} className="text-primary" />
              <span className="text-sm flex-1">Leaderboard Streak</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
            <Link href="/donate" className="flex items-center gap-3 p-3.5 hover:bg-secondary/50 transition">
              <Heart size={17} className="text-primary" />
              <span className="text-sm flex-1">Dukung DramaVers</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
            <Link href="/requests" className="flex items-center gap-3 p-3.5 hover:bg-secondary/50 transition">
              <ListPlus size={17} className="text-primary" />
              <span className="text-sm flex-1">Request Klip</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}