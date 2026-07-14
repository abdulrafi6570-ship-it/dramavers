import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import EvilEye from "@/components/EvilEye";
import ElectricBorder from "@/components/ElectricBorder";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "admin") setLocation("/admin");
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ username, password }, "/admin");
    } catch {
      setError("Username atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: "min(90vw, 90vh)", height: "min(90vw, 90vh)", opacity: 0.18 }}>
          <EvilEye
            eyeColor="#ff4444"
            intensity={1.8}
            pupilSize={0.65}
            irisWidth={0.28}
            glowIntensity={0.5}
            scale={0.7}
            noiseScale={1.2}
            pupilFollow={0.6}
            flameSpeed={0.8}
            backgroundColor="#000000"
          />
        </div>
      </div>

      <Link href="/" className="absolute top-5 left-5 text-xs text-white/30 hover:text-white/60 transition-colors z-10">
        ← Kembali ke web
      </Link>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <ElectricBorder color="#ff6060" speed={0.6} chaos={0.10} borderRadius={20}>
          <div className="glass-panel-strong rounded-2xl p-6 sm:p-8 lg:p-10 overflow-hidden relative">
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />

            <div className="text-center mb-7 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl glass-panel border border-white/12 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white/70" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Admin Panel</h1>
              <p className="text-white/35 text-[11px] sm:text-xs tracking-widest uppercase">Twixtor Archive</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-semibold text-white/40 uppercase tracking-widest">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 sm:h-13 rounded-xl focus:border-white/30 transition-colors text-base sm:text-lg"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-semibold text-white/40 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-12 sm:h-13 rounded-xl focus:border-white/30 transition-colors text-base sm:text-lg pr-12"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs sm:text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-12 sm:h-13 mt-1 bg-white hover:bg-white/90 active:scale-95 text-black font-bold rounded-xl transition-all text-[15px] sm:text-base lg:text-lg flex items-center justify-center gap-2"
                disabled={loading}
              >
                <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                {loading ? "Masuk..." : "Masuk sebagai Admin"}
              </button>
            </form>
          </div>
        </ElectricBorder>

        <p className="text-center text-[11px] sm:text-xs text-white/20 mt-4">
          Bukan admin?{" "}
          <Link href="/login" className="text-white/40 hover:text-white/60 transition-colors">
            Login biasa
          </Link>
        </p>
      </div>
    </div>
  );
}
