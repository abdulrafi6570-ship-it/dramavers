import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, UserCheck, Film, Download } from "lucide-react";
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
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        headers: user ? { Authorization: `Bearer ${localStorage.getItem("twixtor_token")}` } : {},
      });
      if (!res.ok) throw new Error("User not found");
      setProfile(await res.json());
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id, user]);

  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    const token = localStorage.getItem("twixtor_token");
    const method = profile?.isFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/users/${id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      await fetchProfile();
      toast({ title: profile?.isFollowing ? "Berhenti mengikuti" : "Mengikuti!" });
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/8">
            <p className="text-white/40">Pengguna tidak ditemukan</p>
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
                : profile.username.charAt(0).toUpperCase()
              }
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white neon-text-purple">{profile.username}</h1>
                {profile.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs border border-white/20 font-semibold tracking-wide w-fit mx-auto sm:mx-0">
                    ADMIN
                  </span>
                )}
              </div>

              {profile.bio && <p className="text-white/55 text-sm mb-3 max-w-md">{profile.bio}</p>}

              <p className="text-xs text-white/30 mb-4">
                Bergabung {new Date(profile.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
              </p>

              <div className="flex justify-center sm:justify-start gap-8 mb-4">
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
                    : <><UserPlus className="h-4 w-4 mr-2" /> Ikuti</>
                  }
                </Button>
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
      </main>
    </div>
  );
}
