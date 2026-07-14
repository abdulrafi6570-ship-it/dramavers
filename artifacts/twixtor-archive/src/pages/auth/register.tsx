import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Camera, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import EvilEye from "@/components/EvilEye";
import ElectricBorder from "@/components/ElectricBorder";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as any).error || "Registrasi gagal");

      const token = (body as any).token;
      localStorage.setItem("twixtor_token", token);

      if (avatarFile) {
        const form = new FormData();
        form.append("photo", avatarFile);
        await fetch("/api/auth/upload-photo", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }).catch(() => {});
      }

      await qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Akun berhasil dibuat!" });
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Registrasi gagal. Username mungkin sudah dipakai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-5 relative overflow-hidden">
      {/* EvilEye background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: "min(80vw, 80vh)", height: "min(80vw, 80vh)", opacity: 0.12 }}>
          <EvilEye
            eyeColor="#c8dcff"
            intensity={1.2}
            pupilSize={0.55}
            irisWidth={0.22}
            glowIntensity={0.4}
            scale={0.75}
            noiseScale={1.0}
            pupilFollow={0.3}
            flameSpeed={0.5}
            backgroundColor="#000000"
          />
        </div>
      </div>

      <Link href="/" className="mb-7 text-center relative z-10">
        <div className="font-brand text-3xl tracking-[0.12em] text-white">TWIXTOR</div>
        <div className="text-[10px] tracking-[0.5em] text-white/30 mt-0.5">ARCHIVE</div>
      </Link>

      <div className="w-full max-w-sm relative z-10">
        <ElectricBorder color="#a78bfa" speed={0.7} chaos={0.10} borderRadius={20}>
          <div className="glass-panel-strong p-6 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="text-center mb-5">
              <h1 className="font-candy text-2xl text-white mb-1">Buat Akun</h1>
              <p className="text-white/40 text-sm">Gabung & akses semua twixtor clips</p>
            </div>

            {/* Avatar picker */}
            <div className="flex flex-col items-center mb-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group mb-2"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-white/15 overflow-hidden flex items-center justify-center group-hover:border-white/30 transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-white/20" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-black">
                  <Camera className="h-3.5 w-3.5 text-black" />
                </div>
              </button>
              <p className="text-[11px] text-white/25">
                {avatarFile ? avatarFile.name : "Foto profil (opsional)"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-white/30 transition-colors text-base"
                  required
                  minLength={3}
                  autoComplete="username"
                  placeholder="min. 3 karakter"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-white/30 transition-colors text-base"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="min. 6 karakter"
                />
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-12 mt-1 bg-white hover:bg-white/90 active:scale-95 text-black font-bold rounded-xl transition-all text-[15px]"
                disabled={loading}
              >
                {loading ? "Mendaftar..." : "Daftar Sekarang"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-white/40 text-sm">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-white font-bold hover:text-white/80 transition-colors">
                  Masuk
                </Link>
              </p>
            </div>
          </div>
        </ElectricBorder>
      </div>
    </div>
  );
}
