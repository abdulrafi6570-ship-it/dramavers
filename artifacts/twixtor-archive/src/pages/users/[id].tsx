import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, UserCheck, Users, Lock, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PublicProfile {
  id: number;
  username: string;
  photoUrl: string | null;
  bio: string | null;
  role: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedByThem: boolean;
  isFriend: boolean;
  isPrivate: boolean;
}

interface FavDrama {
  id: number;
  name: string;
  posterUrl: string | null;
  category: string;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile]             = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [loadError, setLoadError]         = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [favDramas, setFavDramas]         = useState<FavDrama[]>([]);
  const [favLoading, setFavLoading]       = useState(false);
  const [favLocked, setFavLocked]         = useState(false);

  const token = () => localStorage.getItem("twixtor_token");
  const authHeaders = (): Record<string, string> =>
    user ? { Authorization: `Bearer ${token()}` } : {};

  const fetchProfile = async (isRetry = false) => {
    if (!isRetry) {
      setIsLoading(true);
      setNotFound(false);
      setLoadError(false);
    }
    try {
      const res = await fetch(`/api/users/${id}`, { headers: authHeaders() });
      if (res.status === 404) { setNotFound(true); setIsLoading(false); return; }
      if (!res.ok) throw new Error(`${res.status}`);
      const json: PublicProfile = await res.json();
      setProfile(json);
      setIsLoading(false);
    } catch {
      if (!isRetry) { setTimeout(() => fetchProfile(true), 1200); return; }
      setLoadError(true);
      setIsLoading(false);
    }
  };

  const fetchFavDramas = async (p: PublicProfile) => {
    const isOwn   = user?.id === p.id;
    const canView = isOwn || !p.isPrivate || p.isFriend;
    if (!canView) { setFavLocked(true); return; }
    setFavLoading(true);
    try {
      const res = await fetch(`/api/users/${id}/favorites`, { headers: authHeaders() });
      if (res.status === 403) { setFavLocked(true); return; }
      if (res.ok) setFavDramas(await res.json());
    } catch { /* silent */ }
    finally { setFavLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, [id, user]);
  useEffect(() => { if (profile) fetchFavDramas(profile); }, [profile]);

  const handleFollow = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    const wasFollowing = profile.isFollowing;
    const method = wasFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/users/${id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      const newIsFollowing = !wasFollowing;
      const newIsFriend = newIsFollowing && profile.isFollowedByThem;
      setProfile((p) => p ? {
        ...p,
        isFollowing: newIsFollowing,
        isFriend: newIsFriend,
        followerCount: p.followerCount + (newIsFollowing ? 1 : -1),
      } : p);
      toast({ title: wasFollowing ? "Berhenti mengikuti" : "Mengikuti!" });
    } catch {
      toast({ title: "Gagal", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
          <div className="glass-panel rounded-2xl p-8 animate-pulse h-64" />
        </main>
      </div>
    );
  }

  if (notFound || loadError || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/8">
            {notFound ? (
              <p className="text-white/40">Pengguna tidak ditemukan</p>
            ) : (
              <>
                <p className="text-white/40 mb-4">Gagal memuat profil. Coba lagi sebentar.</p>
                <Button variant="outline" className="border-white/15 text-white/60 hover:text-white hover:bg-white/8" onClick={() => fetchProfile()}>
                  Coba Lagi
                </Button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="glass-panel p-8 rounded-2xl border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.03] rounded-full blur-[120px]" />
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            <div className="w-24 h-24 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-3xl font-bold text-white overflow-hidden flex-shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.06)]">
              {profile.photoUrl
                ? <img src={profile.photoUrl} alt={profile.username} className="w-full h-full object-cover" />
                : profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-white neon-text-purple">{profile.username}</h1>
                {profile.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs border border-white/20 font-semibold tracking-wide">ADMIN</span>
                )}
                {profile.isFriend && !isOwnProfile && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-xs border border-green-500/30 font-semibold flex items-center gap-1">
                    <Users className="h-3 w-3" /> Teman
                  </span>
                )}
                {profile.isPrivate && (
                  <span className="px-2 py-0.5 rounded-full bg-white/8 text-white/40 text-xs border border-white/10 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Privat
                  </span>
                )}
              </div>

              {!isOwnProfile && profile.isFollowedByThem && !profile.isFollowing && (
                <p className="text-xs text-white/40 mb-2">Mengikuti kamu · Follow balik untuk jadi teman</p>
              )}

              {profile.bio && <p className="text-white/55 text-sm mb-3 max-w-md">{profile.bio}</p>}
              <p className="text-xs text-white/30 mb-4">
                Bergabung {new Date(profile.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
              </p>

              <div className="flex justify-center sm:justify-start gap-8 mb-5">
                <div className="text-center">
                  <p className="text-xl font-bold text-white neon-text-blue">{profile.followingCount}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Mengikuti</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white neon-text-blue">{profile.followerCount}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Pengikut</p>
                </div>
              </div>

              {user && !isOwnProfile && (
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={profile.isFollowing
                    ? "bg-white/10 border border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/40 hover:text-red-300"
                    : "bg-white hover:bg-white/90 text-black font-semibold"
                  }
                >
                  {profile.isFollowing
                    ? <><UserCheck className="h-4 w-4 mr-2" /> Mengikuti</>
                    : <><UserPlus className="h-4 w-4 mr-2" />{profile.isFollowedByThem ? "Follow Balik" : "Ikuti"}</>
                  }
                </Button>
              )}
              {user && !isOwnProfile && (!profile.isPrivate || profile.isFriend) && (
                <Link href={`/messages/${profile.id}`}>
                  <Button variant="outline" className="border-white/20 text-white/80 hover:text-white hover:bg-white/8 ml-2">
                    <MessageCircle className="h-4 w-4 mr-2" /> Chat
                  </Button>
                </Link>
              )}
              {isOwnProfile && (
                <Link href="/profile">
                  <Button variant="outline" className="border-white/15 text-white/60 hover:text-white hover:bg-white/8">
                    Lihat profil saya
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            <h2 className="text-sm font-semibold text-white/80 uppercase tracking-widest">Drama Favorit</h2>
          </div>
          {favLocked ? (
            <div className="px-6 py-12 text-center">
              <Lock className="h-8 w-8 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Akun ini privat</p>
              {!profile.isFollowing && !isOwnProfile && (
                <p className="text-white/25 text-xs mt-1">Ikuti dan tunggu di-follow balik untuk bisa melihat favorit</p>
              )}
            </div>
          ) : favLoading ? (
            <div className="grid grid-cols-3 gap-3 p-6">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />)}
            </div>
          ) : favDramas.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 p-6">
              {favDramas.map((drama) => (
                <Link key={drama.id} href={`/dramas/${drama.id}`}
                  className="group aspect-[2/3] relative rounded-lg overflow-hidden glass-panel border-white/5 hover:border-primary/50 transition-colors">
                  {drama.posterUrl
                    ? <img src={drama.posterUrl} alt={drama.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity" />
                    : <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-white/20 text-xs p-2 text-center">{drama.name}</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-2">
                    <span className="text-xs font-medium text-white line-clamp-2 leading-tight">{drama.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Heart className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Belum ada drama favorit</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
