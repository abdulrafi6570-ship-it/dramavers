import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import EvilEye from "@/components/EvilEye";
import ElectricBorder from "@/components/ElectricBorder";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ username, password });
      window.dispatchEvent(new Event("user-logged-in"));
    } catch {
      setError("Username atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: "min(80vw, 80vh)", height: "min(80vw, 80vh)", opacity: 0.14 }}>
          <EvilEye
            eyeColor="#c8dcff"
            intensity={1.2}
            pupilSize={0.55}
            irisWidth={0.22}
            glowIntensity={0.4}
            scale={0.75}
            noiseScale={1.0}
            pupilFollow={0.4}
            flameSpeed={0.6}
            backgroundColor="#000000"
          />
        </div>
      </div>

      <Link href="/" className="mb-8 text-center relative z-10">
        <div className="font-brand text-3xl tracking-[0.12em] text-white">TWIXTOR</div>
        <div className="text-[10px] tracking-[0.5em] text-white/30 mt-0.5">ARCHIVE</div>
      </Link>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <ElectricBorder color="#7df9ff" speed={0.7} chaos={0.10} borderRadius={20}>
          <div className="glass-panel-strong p-6 sm:p-8 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="text-center mb-6">
              <h1 className="font-candy text-2xl sm:text-3xl text-white mb-1">Selamat Datang</h1>
              <p className="text-white/40 text-sm">Masuk ke akun kamu</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-white/30 transition-colors text-base"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:border-white/30 transition-colors text-base pr-12"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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
                {loading ? "Masuk..." : "Masuk"}
              </button>
            </form>

            <div className="mt-5 text-center space-y-2.5">
              <p className="text-white/40 text-sm">
                Belum punya akun?{" "}
                <Link href="/register" className="text-white font-bold hover:text-white/80 transition-colors">
                  Daftar
                </Link>
              </p>
              <p className="text-white/20 text-xs">
                Admin?{" "}
                <Link href="/admin/login" className="text-white/35 hover:text-white/55 transition-colors">
                  Login admin →
                </Link>
              </p>
            </div>
          </div>
        </ElectricBorder>
      </div>
    </div>
  );
}
