'use client';

import { useEffect, useState } from 'react';
import { Megaphone, ExternalLink, X } from 'lucide-react';

const STORAGE_KEY = 'dramavers_dismissed_announcement';

export default function RunningAnnouncement() {
  const [config, setConfig] = useState(null);
  const [closed, setClosed] = useState(true); // Default disembunyikan sampai pengecekan selesai

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        const ann = data?.announcement;
        if (ann && ann.is_active && ann.running_text) {
          // Cek apakah pengumuman dengan teks ini sudah pernah disilang oleh user
          const dismissedText = localStorage.getItem(STORAGE_KEY);
          if (dismissedText !== ann.running_text) {
            setConfig(ann);
            setClosed(false);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setClosed(true);
    if (config?.running_text) {
      // Simpan ke localStorage agar tidak muncul lagi saat pindah halaman / balik ke Home
      localStorage.setItem(STORAGE_KEY, config.running_text);
    }
  };

  if (closed || !config || !config.is_active || !config.running_text) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 overflow-hidden rounded-2xl border-[3px] border-border bg-highlight px-3 py-2 text-highlight-foreground shadow-neo-sm animate-fade-in">
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-border bg-primary text-primary-foreground">
          <Megaphone size={14} />
        </span>

        {/* Teks Berjalan (Marquee) */}
        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-[marquee_18s_linear_infinite] text-xs font-extrabold tracking-wide">
            <span className="mx-4">{config.running_text}</span>
            <span className="mx-4">•</span>
            <span className="mx-4">{config.running_text}</span>
          </div>
        </div>
      </div>

      {/* Tombol Cek TikTok & Tombol Silang (X) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {config.tiktok_url && (
          <a
            href={config.tiktok_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border-2 border-border bg-card px-2.5 py-1 text-[11px] font-extrabold text-foreground shadow-neo-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Cek TikTok</span>
            <ExternalLink size={12} />
          </a>
        )}

        <button
          type="button"
          onClick={handleClose}
          aria-label="Tutup Pengumuman"
          className="grid h-7 w-7 place-items-center rounded-xl border-2 border-border bg-card text-foreground shadow-neo-sm transition-colors hover:bg-red-500 hover:text-white active:translate-y-0.5"
        >
          <X size={14} />
        </button>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}