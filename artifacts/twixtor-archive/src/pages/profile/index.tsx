import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Link, useLocation } from "wouter";
import ProfileCard from "@/components/ProfileCard";
import FallingText from "@/components/FallingText";
import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const TEAM_PROFILES = [
  {
    name: "RAPP",
    title: "Archive Manager",
    handle: "rapp",
    avatarUrl: "/avatars/avatar4_nobg.png",
    status: "Online",
    innerGradient: "linear-gradient(145deg, rgba(8,8,18,0.96) 0%, rgba(16,16,30,0.88) 100%)",
    behindGlowColor: "rgba(200, 210, 255, 0.22)",
  },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState((user as any)?.bio ?? "");

  if (!user) {
    setLocation("/login");
    return null;
  }

  const u = user as any;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/auth/upload-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("twixtor_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      await res.json();
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Foto profil diperbarui!" });
    } catch {
      toast({ title: "Gagal upload foto", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveBio() {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("twixtor_token")}`,
        },
        body: JSON.stringify({ bio: bioText }),
      });
      if (!res.ok) throw new Error("Failed");
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Bio diperbarui!" });
      setEditingBio(false);
    } catch {
      toast({ title: "Gagal update bio", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">

        {/* User profile header */}
        <div className="glass-panel p-8 rounded-2xl border-white/10 mb-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.03] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/[0.02] rounded-full blur-[100px]" />
          </div>

          {/* Avatar with upload */}
          <div className="relative z-10 flex-shrink-0">
            <div className="w-28 h-28 rounded-full glass-panel-strong border border-white/15 flex items-center justify-center text-4xl font-bold text-white overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.06)]">
              {u.photoUrl
                ? <img src={u.photoUrl} alt={user.username} className="w-full h-full object-cover" />
                : user.username.charAt(0).toUpperCase()
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white/15 border border-white/25 flex items-center justify-center hover:bg-white/25 transition-all"
              title="Ganti foto profil"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Camera className="h-3.5 w-3.5 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="text-center md:text-left relative z-10 flex-1">
            <h1 className="font-heyam text-3xl text-white mb-2 neon-text-purple">{user.username}</h1>

            {/* Bio */}
            <div className="mb-3">
              {editingBio ? (
                <div className="flex gap-2 items-start">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    maxLength={300}
                    rows={2}
                    className="flex-1 bg-white/5 border border-white/15 rounded-lg p-2 text-sm text-white placeholder:text-white/30 resize-none outline-none focus:border-white/30"
                    placeholder="Tulis bio singkat..."
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={handleSaveBio} className="px-3 py-1 text-xs bg-white text-black rounded-lg font-semibold hover:bg-white/90">Simpan</button>
                    <button onClick={() => setEditingBio(false)} className="px-3 py-1 text-xs text-white/40 hover:text-white">Batal</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setBioText(u.bio ?? ""); setEditingBio(true); }} className="text-left group">
                  <p className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    {u.bio || <span className="text-white/25 italic">Tambah bio...</span>}
                  </p>
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/60 border border-white/8">
                Joined {new Date(user.createdAt).toLocaleDateString("id-ID")}
              </span>
              {user.verified && (
                <span className="px-3 py-1 rounded-full bg-white/8 text-white/90 text-xs border border-white/15 shadow-[0_0_12px_rgba(255,255,255,0.08)]">
                  ✓ Verified
                </span>
              )}
              {user.role === "admin" && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs border border-white/20 shadow-[0_0_16px_rgba(255,255,255,0.12)] font-semibold tracking-wide">
                  ADMIN
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1 md:flex md:justify-start md:gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.totalDownloads || 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Downloads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.totalFavorites || 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Favorites</p>
              </div>
              <Link href={`/users/${user.id}/following`} className="text-center group">
                <p className="text-2xl font-bold text-white neon-text-blue group-hover:opacity-80 transition-opacity">{u.followingCount ?? 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Mengikuti</p>
              </Link>
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.followerCount ?? 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Pengikut</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="relative z-10 px-5 py-2.5 rounded-xl glass-panel border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/25 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {[
            { href: "/favorites", label: "Favorites", desc: "Videos you liked" },
            { href: "/bookmarks", label: "Bookmarks", desc: "Saved for later" },
            { href: "/history", label: "History", desc: "Previously downloaded" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass-panel p-6 rounded-xl border-white/5 hover:border-white/20 transition-all group hover:shadow-[0_0_24px_rgba(255,255,255,0.04)]"
            >
              <h3 className="text-base font-semibold text-white mb-1 group-hover:neon-text-blue transition-colors">{item.label}</h3>
              <p className="text-sm text-white/40">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Team ProfileCards */}
        <div className="mb-6">
          <h2 className="font-heading text-lg text-white/80 tracking-widest uppercase text-center mb-2">
            Pembuat
          </h2>

          <div style={{ height: "120px" }} className="mb-8">
            <FallingText
              text="Pengelola Twixtor Archive — drama clips slow motion edits curated with love"
              highlightWords={["Twixtor", "Archive", "drama", "clips", "love"]}
              highlightClass="highlighted"
              trigger="scroll"
              backgroundColor="transparent"
              wireframes={false}
              gravity={0.6}
              fontSize="0.9rem"
              mouseConstraintStiffness={0.9}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {TEAM_PROFILES.map((profile) => (
              <ProfileCard
                key={profile.handle}
                name={profile.name}
                title={profile.title}
                handle={profile.handle}
                avatarUrl={profile.avatarUrl}
                status={profile.status}
                innerGradient={profile.innerGradient}
                behindGlowColor={profile.behindGlowColor}
                behindGlowEnabled
                enableTilt
                showUserInfo
                contactText="Follow"
              />
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
