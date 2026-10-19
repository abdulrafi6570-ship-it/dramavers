import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl glass-panel border border-white/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-white/40" />
        </div>
        <h1 className="text-6xl font-black text-white mb-2 tracking-tight">404</h1>
        <p className="text-lg font-semibold text-white/60 mb-2">Halaman tidak ditemukan</p>
        <p className="text-sm text-white/30 mb-8 max-w-xs mx-auto">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
