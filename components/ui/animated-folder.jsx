'use client';

import { useState } from 'react';
import Link from 'next/link';

const DEFAULT_GRADIENTS = [
  {
    back: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    front: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 50%, #e11d48 100%)',
  },
  {
    back: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
    front: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #6d28d9 100%)',
  },
  {
    back: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
    front: 'linear-gradient(135deg, #e879f9 0%, #a855f7 50%, #db2777 100%)',
  },
  {
    back: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
    front: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #4f46e5 100%)',
  },
  {
    back: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
    front: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ef4444 100%)',
  },
  {
    back: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    front: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #0d9488 100%)',
  },
];

export function AnimatedFolder({
  title,
  name,
  projects = [],
  gradient,
  index = 0,
  href,
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);
  const folderTitle = title || name || 'Kategori';
  const preset = DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
  const backBg = gradient || preset.back;
  const frontBg = gradient || preset.front;

  const previewItems = (projects || []).slice(0, 3);

  const cardContent = (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col items-center justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-neo-sm cursor-pointer select-none ${className}`}
    >
      {/* Area Visual Folder 3D */}
      <div
        className="relative my-4 flex h-32 w-36 items-center justify-center"
        style={{ perspective: '800px' }}
      >
        {/* Bayangan Dasar Folder */}
        <div
          className="absolute bottom-1 h-4 w-28 rounded-full bg-black/15 blur-md transition-all duration-300 group-hover:w-32 group-hover:bg-black/25"
        />

        {/* Bagian Belakang Folder + Tab Atas */}
        <div
          className="relative h-24 w-32 rounded-2xl shadow-sm transition-transform duration-300"
          style={{ background: backBg }}
        >
          {/* Tab Folder Kiri Atas */}
          <div
            className="absolute -top-2.5 left-3.5 h-4 w-11 rounded-t-lg"
            style={{ background: backBg }}
          />
        </div>

        {/* Kartu Preview Poster yang Menyembul Saat Hover */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {previewItems.map((item, idx) => {
            const angles = [-12, 0, 12];
            const xOffsets = [-18, 0, 18];
            const yHover = -38 - idx * 4;
            const rot = angles[idx % 3];
            const xOff = xOffsets[idx % 3];

            return (
              <div
                key={item.id || idx}
                style={{
                  transform: isHovered
                    ? `translate(${xOff}px, ${yHover}px) rotate(${rot}deg) scale(1.05)`
                    : `translate(${idx * 2}px, -4px) rotate(${idx * 2}deg) scale(0.92)`,
                  zIndex: 10 + idx,
                }}
                className="absolute h-20 w-16 overflow-hidden rounded-xl border-2 border-white bg-muted shadow-md transition-all duration-300 ease-out"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.title || ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-[9px] font-bold text-secondary-foreground p-1 text-center">
                    {item.title || 'Klip'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bagian Depan Folder (Membuka ke Depan secara 3D saat Hover) */}
        <div
          style={{
            background: frontBg,
            transformOrigin: 'bottom center',
            transform: isHovered
              ? 'rotateX(-28deg) translateY(2px) scaleY(0.96)'
              : 'rotateX(0deg) translateY(4px) scaleX(0.98)',
            zIndex: 30,
          }}
          className="absolute h-24 w-32 rounded-2xl shadow-md transition-all duration-300 ease-out"
        >
          {/* Kilau Halus di Atas Folder */}
          <div className="h-full w-full rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-black/10" />
        </div>
      </div>

      {/* Info Nama Kategori & Jumlah */}
      <div className="mt-2 w-full text-center space-y-0.5">
        <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-foreground truncate">
          {folderTitle}
        </h3>
        <p className="text-xs text-muted-foreground">
          {projects.length} drama
        </p>
      </div>

      {/* Tulisan BUKA (Menggantikan HOVER) */}
      <div className="mt-2 flex w-full justify-end">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 transition-colors group-hover:text-primary">
          BUKA
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default AnimatedFolder;