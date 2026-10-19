'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Jangan tampilkan tombol kembali jika sedang di halaman utama (Home)
  if (pathname === '/') return null;

  return (
    <div className="sticky top-20 z-40 mb-4 pointer-events-none">
      <button
        type="button"
        onClick={() => router.back()}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border-[3px] border-border bg-card/95 backdrop-blur-sm px-3.5 py-2 text-sm font-bold text-foreground shadow-neo-sm transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <ArrowLeft size={16} />
        <span>Kembali</span>
      </button>
    </div>
  );
}