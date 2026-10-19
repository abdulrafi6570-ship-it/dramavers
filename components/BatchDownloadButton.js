'use client';

import { useState } from 'react';
import { Download, Lock, KeyRound, X, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function BatchDownloadButton({ clips = [], label = 'Download Semua Klip' }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');

  if (!clips || clips.length === 0) return null;

  const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startBatchDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setProgress(0);

    try {
      // Cek izin akses pada klip pertama terlebih dahulu
      const firstClip = clips[0];
      const checkRes = await fetch(`/api/clips/${firstClip.id}/download`, {
        method: 'POST',
      });
      const checkData = await checkRes.json().catch(() => ({}));

      if (!checkRes.ok || checkData.locked) {
        // Ambil link TikTok dari pengaturan untuk ditampilkan di modal
        fetch('/api/admin/settings')
          .then((r) => r.json())
          .then((d) => {
            if (d?.announcement?.tiktok_url) setTiktokUrl(d.announcement.tiktok_url);
          })
          .catch(() => {});

        setShowUnlockModal(true);
        setDownloading(false);
        return;
      }

      // Jika sudah terbuka, unduh semua klip secara berurutan dengan jeda 1.2 detik
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        setProgress(i + 1);
        triggerDownload(
          `/api/clips/${c.id}/download`,
          `${c.title || `klip-${i + 1}`}.mp4`
        );
        // Jeda agar browser tidak memblokir multiple download
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    } catch (err) {
      setShowUnlockModal(true);
    } finally {
      setDownloading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;

    setRedeemLoading(true);
    setRedeemError('');

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRedeemError(data.error || 'Kode tidak valid.');
        setRedeemLoading(false);
        return;
      }

      setShowUnlockModal(false);
      setRedeemCode('');
      await startBatchDownload();
    } catch {
      setRedeemError('Gagal memverifikasi kode.');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={startBatchDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-2xl border-[3px] border-border bg-primary px-4 py-2.5 text-xs sm:text-sm font-extrabold text-primary-foreground shadow-neo-sm transition-all hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
      >
        {progress > 0 && !downloading ? (
          <>
            <CheckCircle2 size={16} />
            <span>Selesai Diunduh!</span>
          </>
        ) : (
          <>
            <Download size={16} className={downloading ? 'animate-bounce' : ''} />
            <span>
              {downloading
                ? `Mengunduh (${progress}/${clips.length})...`
                : `${label} (${clips.length})`}
            </span>
          </>
        )}
      </button>

      {showUnlockModal && (
        <div
          onClick={() => setShowUnlockModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border-[3px] border-border bg-card p-5 shadow-neo space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl border-2 border-border bg-highlight text-highlight-foreground">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Download Semua Terkunci</h3>
                  <p className="text-xs text-muted-foreground">
                    Masukkan kode dari TikTok cukup 1x untuk membuka semua download.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-border bg-muted hover:bg-primary hover:text-primary-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {tiktokUrl && (
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border-2 border-border bg-secondary px-3.5 py-2 text-xs font-bold text-secondary-foreground hover:opacity-90"
              >
                <span>🎵 Belum punya kode? Lihat di TikTok kami</span>
                <ExternalLink size={14} />
              </a>
            )}

            <form onSubmit={handleRedeemSubmit} className="space-y-3">
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="Masukkan kode TikTok..."
                  autoFocus
                  className="w-full rounded-xl border-[3px] border-border bg-background py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none"
                />
              </div>

              {redeemError && (
                <p className="text-xs font-bold text-red-500">{redeemError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="rounded-xl border-2 border-border bg-muted px-4 py-2 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={redeemLoading || !redeemCode.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl border-[3px] border-border bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-neo-sm disabled:opacity-60"
                >
                  <span>{redeemLoading ? 'Memeriksa...' : 'Buka & Download Semua'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}