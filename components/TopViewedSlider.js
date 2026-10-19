'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Play, ChevronLeft, ChevronRight, Flame, Film } from 'lucide-react';

export default function TopViewedSlider({ items = [] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  // Otomatis geser slide setiap 4 detik
  useEffect(() => {
    if (total <= 1 || paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 4000);
    return () => clearInterval(timer);
  }, [total, paused]);

  if (total === 0) return null;

  const prevSlide = () => setCurrent((c) => (c - 1 + total) % total);
  const nextSlide = () => setCurrent((c) => (c + 1) % total);

  const activeItem = items[current];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-3xl border-[3px] border-border bg-card shadow-neo"
    >
      <div className="relative h-[220px] sm:h-[290px] w-full bg-black overflow-hidden">
        {/* Background Visual (Poster / Thumbnail / Preview Video) */}
        {activeItem.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={activeItem.id}
            src={activeItem.image}
            alt={activeItem.title}
            className="h-full w-full object-cover opacity-80 transition-all duration-500 scale-105"
          />
        ) : activeItem.video_url ? (
          <video
            key={activeItem.id}
            src={activeItem.video_url}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/40 via-secondary/40 to-black" />
        )}

        {/* Gradasi Gelap agar Teks Jelas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        {/* Badge Peringkat & Jumlah Penonton di Kiri Atas */}
        <div className="absolute top-3.5 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-highlight px-3 py-1 text-xs font-extrabold text-highlight-foreground shadow-neo-sm">
            <Flame size={14} className="fill-current" />
            <span>#{current + 1} Paling Banyak Ditonton</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/30 bg-black/60 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
            <Eye size={14} className="text-primary" />
            <span>{activeItem.views}x ditonton</span>
          </span>
        </div>

        {/* Informasi Klip & Tombol Tonton di Bawah */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1 min-w-0 max-w-lg text-white">
            {activeItem.dramaTitle && (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-primary-foreground bg-primary/90 px-2.5 py-0.5 rounded-md border border-border">
                <Film size={12} />
                <span className="truncate">{activeItem.dramaTitle}</span>
              </div>
            )}
            <h2 className="text-lg sm:text-2xl font-extrabold truncate drop-shadow-md">
              {activeItem.title}
            </h2>
            {activeItem.description && (
              <p className="text-xs text-white/80 line-clamp-1">
                {activeItem.description}
              </p>
            )}
          </div>

          <Link
            href={activeItem.href}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-[3px] border-border bg-primary px-4 py-2.5 text-xs sm:text-sm font-extrabold text-primary-foreground shadow-neo-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play size={16} fill="currentColor" />
            <span>Tonton Klip</span>
          </Link>
        </div>

        {/* Tombol Panah Kiri & Kanan */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Slide Sebelumnya"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 grid h-9 w-9 place-items-center rounded-full border-2 border-border bg-card/90 text-foreground shadow-neo-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Slide Berikutnya"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 grid h-9 w-9 place-items-center rounded-full border-2 border-border bg-card/90 text-foreground shadow-neo-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Indikator Titik Slide di Bawah */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 border-t-2 border-border bg-card py-2.5">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-2.5 rounded-full border border-border transition-all ${
                idx === current ? 'w-7 bg-primary' : 'w-2.5 bg-muted hover:bg-secondary'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}