'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, RotateCw, Sparkles, X } from 'lucide-react';

const R = 300;   // jari-jari lintasan kartu
const STEP = 26; // derajat antar kartu

export default function FilmWheel({ films = [] }) {
  const n = films.length;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Kunci scroll halaman belakang saat modal terbuka & tutup dengan tombol ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (n === 0) return null;

  const go = (dir) => {
    if (spinning || n < 2 || dir === 0) return;
    setIndex((i) => (((i + dir) % n) + n) % n);
    setRot((r) => r + dir * (360 / n));
  };

  const spin = () => {
    if (spinning || n < 2) return;
    setSpinning(true);
    const target = Math.floor(Math.random() * n);
    const steps = 2 * n + ((target - index + n) % n); // minimal 2 putaran
    let done = 0;

    const tick = () => {
      setIndex((i) => (i + 1) % n);
      setRot((r) => r + 360 / n);
      done += 1;
      if (done >= steps) {
        setSpinning(false);
        return;
      }
      timer.current = setTimeout(tick, 60 + Math.pow(done / steps, 3) * 340);
    };
    timer.current = setTimeout(tick, 60);
  };

  const offsetOf = (i) => {
    let o = (i - index + n) % n;
    if (o > n / 2) o -= n;
    return o;
  };

  const current = films[index];

  return (
    <>
      {/* BANNER PEMICU (Tampilan Ringkas di Halaman Utama) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-[3px] border-border bg-gradient-to-r from-card via-card to-muted p-4 shadow-neo-sm">
        <div className="flex items-center gap-3.5">
          {/* Tumpukan mini poster */}
          <div className="flex -space-x-3 overflow-hidden py-1 pl-1">
            {films.slice(0, 3).map((f) => (
              <div
                key={f.id}
                className="h-12 w-9 shrink-0 overflow-hidden rounded-lg border-2 border-border bg-muted shadow-sm first:-rotate-6 last:rotate-6"
              >
                {f.poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.poster} alt={f.title} className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-bold text-base">Bingung Mau Nonton Apa?</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Coba putar roda keberuntungan untuk dapat rekomendasi film pilihan!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-[3px] border-border bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-neo-sm transition-all hover:opacity-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <RotateCw size={16} />
          Putar Film Pilihan
        </button>
      </div>

      {/* MODAL POP-UP RODA PUTAR */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-3xl border-[3px] border-border bg-background p-4 sm:p-6 shadow-neo"
            >
              {/* Header Modal */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <h2 className="text-lg font-bold">Roda Film Pilihan</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup"
                  className="grid h-9 w-9 place-items-center rounded-full border-[2px] border-border bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Area Roda Putar */}
              <motion.div
                onPanEnd={(e, info) => {
                  if (info.offset.x < -40) go(1);
                  else if (info.offset.x > 40) go(-1);
                }}
                style={{ touchAction: 'pan-y' }}
                className="relative h-[390px] sm:h-[420px] overflow-hidden rounded-2xl border-[3px] border-border bg-gradient-to-b from-card to-muted shadow-neo-sm"
              >
                {/* roda */}
                <motion.div
                  className="absolute left-1/2 top-[245px] sm:top-[262px] -ml-[190px] h-[380px] w-[380px] rounded-full border-[3px] border-border"
                  style={{
                    background:
                      'repeating-conic-gradient(hsl(var(--primary)) 0deg 45deg, hsl(var(--highlight)) 45deg 90deg, hsl(var(--secondary)) 90deg 135deg, hsl(var(--card)) 135deg 180deg)',
                  }}
                  animate={{ rotate: rot }}
                  transition={{ type: 'spring', stiffness: spinning ? 200 : 90, damping: 22 }}
                >
                  <div className="absolute inset-[34%] rounded-full border-[3px] border-border bg-card" />
                </motion.div>

                {/* penunjuk */}
                <div className="absolute left-1/2 top-[233px] sm:top-[250px] z-30 -ml-3 h-0 w-0 border-x-[12px] border-b-[18px] border-x-transparent border-b-foreground" />

                {/* kartu film */}
                {films.map((f, i) => {
                  const o = offsetOf(i);
                  if (Math.abs(o) > 2) return null;
                  const a = (o * STEP * Math.PI) / 180;
                  const center = o === 0;

                  const poster = (
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border-[3px] border-border bg-muted shadow-neo-sm">
                      {f.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.poster}
                          alt={f.title}
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      {center && (
                        <div className="absolute inset-0 grid place-items-center bg-black/10">
                          <span className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-border bg-primary text-primary-foreground shadow-neo-sm">
                            <Play size={20} fill="currentColor" />
                          </span>
                        </div>
                      )}
                    </div>
                  );

                  return (
                    <motion.div
                      key={f.id}
                      className="absolute left-1/2 top-7 sm:top-10 -ml-[70px] sm:-ml-[75px] w-[140px] sm:w-[150px]"
                      style={{ zIndex: 10 - Math.abs(o) }}
                      initial={false}
                      animate={{
                        x: Math.sin(a) * R,
                        y: (1 - Math.cos(a)) * R,
                        rotate: o * STEP,
                        scale: center ? 1 : 0.8,
                        opacity: Math.abs(o) === 2 ? 0.85 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: spinning ? 520 : 240, damping: 30 }}
                    >
                      {center ? (
                        <Link
                          href={`/drama/${f.id}`}
                          onClick={() => setOpen(false)}
                          aria-label={f.title}
                        >
                          {poster}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => go(o)}
                          aria-label={f.title}
                          className="block w-full"
                        >
                          {poster}
                        </button>
                      )}
                    </motion.div>
                  );
                })}

                {/* panah kiri & kanan */}
                {n > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Sebelumnya"
                      className="absolute left-3 top-[130px] sm:top-[140px] z-30 grid h-10 w-10 place-items-center rounded-full border-[3px] border-border bg-highlight text-highlight-foreground shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Berikutnya"
                      className="absolute right-3 top-[130px] sm:top-[140px] z-30 grid h-10 w-10 place-items-center rounded-full border-[3px] border-border bg-highlight text-highlight-foreground shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </motion.div>

              {/* Footer Modal: Judul Film & Tombol Aksi */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base truncate">{current.title}</p>
                  {current.category && (
                    <p className="text-xs text-muted-foreground truncate">{current.category}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/drama/${current.id}`}
                    onClick={() => setOpen(false)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-[3px] border-border bg-secondary px-3.5 py-2.5 text-sm font-bold text-secondary-foreground shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    <Play size={15} fill="currentColor" />
                    Tonton
                  </Link>

                  {n > 1 && (
                    <button
                      type="button"
                      onClick={spin}
                      disabled={spinning}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border-[3px] border-border bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
                    >
                      <RotateCw size={16} className={spinning ? 'animate-spin' : ''} />
                      {spinning ? 'Memutar...' : 'Putar Acak'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}