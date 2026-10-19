'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Bookmark,
  FolderPlus,
  Link2,
  Download,
  Camera,
  Check,
  Lock,
  KeyRound,
  X,
  ExternalLink,
  Play,
} from 'lucide-react';
import ClipComments from './ClipComments';
import AddToCollectionSheet from './AddToCollectionSheet';

export default function ReelItem({ clip }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [liked, setLiked] = useState(Boolean(clip.liked_by_me));
  const [likesCount, setLikesCount] = useState(clip.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(Boolean(clip.bookmarked_by_me));
  const [commentsCount, setCommentsCount] = useState(clip.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [captured, setCaptured] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');

  const sourceDrama = clip.dramas;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (videoRef.current) {
              videoRef.current
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            }
            fetch(`/api/clips/${clip.id}/view`, { method: 'POST' }).catch(() => {});
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
            setShowComments(false);
          }
        });
      },
      { threshold: 0.65 }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [clip.id]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  // Fungsi Ambil Foto / Frame HD di Reels
  const handleCaptureFrame = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1920;
      const ctx = canvas.getContext('2d');

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${clip.title || 'dramavers'}-frame.png`;
        a.click();
        setCaptured(true);
        setTimeout(() => setCaptured(false), 2000);
      } catch {
        const tempVideo = document.createElement('video');
        tempVideo.crossOrigin = 'anonymous';
        tempVideo.src = `/api/clips/${clip.id}/download`;
        tempVideo.currentTime = video.currentTime || 0.1;
        tempVideo.muted = true;

        await new Promise((resolve, reject) => {
          tempVideo.onseeked = resolve;
          tempVideo.onerror = reject;
          tempVideo.load();
        });

        ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${clip.title || 'dramavers'}-frame.png`;
        a.click();
        setCaptured(true);
        setTimeout(() => setCaptured(false), 2000);
      }
    } catch {
      setShowUnlockModal(true);
    }
  };

  const toggleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikesCount((c) => (prev ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await fetch(`/api/clips/${clip.id}/like`, { method: 'POST' });
      if (!res.ok) {
        setLiked(prev);
        setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      }
    } catch {
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const toggleBookmark = async () => {
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const res = await fetch(`/api/clips/${clip.id}/bookmark`, { method: 'POST' });
      if (!res.ok) setBookmarked(prev);
    } catch {
      setBookmarked(prev);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/drama/${clip.drama_id}#clip-${clip.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerSamePageDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${clip.title || 'clip'}.mp4`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setRedeemError('');

    try {
      const res = await fetch(`/api/clips/${clip.id}/download`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.locked) {
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

      const targetUrl = data.downloadUrl || `/api/clips/${clip.id}/download`;
      triggerSamePageDownload(targetUrl, `${clip.title || 'dramavers-clip'}.mp4`);
    } catch {
      setShowUnlockModal(true);
    } finally {
      setDownloading(false);
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
      await handleDownload();
    } catch {
      setRedeemError('Gagal memverifikasi kode.');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative h-full w-full snap-start snap-always flex items-center justify-center bg-black select-none overflow-hidden"
    >
      <div className="relative h-full w-full max-w-[500px] mx-auto flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={clip.video_url}
          poster={clip.thumbnail_url || undefined}
          loop
          playsInline
          controlsList="nodownload"
          onClick={togglePlay}
          onContextMenu={(e) => e.preventDefault()}
          className="h-full w-full object-contain cursor-pointer"
        />

        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Putar"
            className="absolute inset-0 z-10 grid place-items-center bg-black/20"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full border-[3px] border-border bg-white/90 text-black shadow-neo-sm">
              <Play size={26} fill="currentColor" className="ml-1" />
            </span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* INFO KLIP DI KIRI BAWAH */}
        <div className="absolute left-4 right-20 bottom-6 z-20 text-white space-y-2 pointer-events-auto">
          {sourceDrama && (
            <Link
              href={`/drama/${sourceDrama.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/50 px-3 py-1 text-xs font-bold backdrop-blur-md hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <span>🎬</span>
              <span className="truncate max-w-[180px]">{sourceDrama.title}</span>
            </Link>
          )}

          <h2 className="font-extrabold text-base sm:text-lg leading-snug drop-shadow-md">
            {clip.title || 'Klip Terbaru'}
          </h2>

          {clip.description && (
            <p className="text-xs text-white/85 line-clamp-2 drop-shadow">
              {clip.description}
            </p>
          )}
        </div>

        {/* DERETAN TOMBOL VERTIKAL DI KANAN */}
        <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-3.5 text-white pointer-events-auto">
          {/* 1. Like */}
          <button
            type="button"
            onClick={toggleLike}
            className="group flex flex-col items-center gap-1"
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-full border-2 backdrop-blur-md transition-transform active:scale-90 ${
                liked
                  ? 'border-primary bg-primary text-primary-foreground shadow-neo-sm'
                  : 'border-white/30 bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </span>
            <span className="text-[10px] font-extrabold drop-shadow">{likesCount}</span>
          </button>

          {/* 2. Komentar */}
          <button
            type="button"
            onClick={() => setShowComments(true)}
            className="group flex flex-col items-center gap-1"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/30 bg-black/50 text-white backdrop-blur-md transition-transform hover:bg-black/70 active:scale-90">
              <MessageCircle size={18} />
            </span>
            <span className="text-[10px] font-extrabold drop-shadow">{commentsCount}</span>
          </button>

          {/* 3. Bookmark */}
          <button
            type="button"
            onClick={toggleBookmark}
            className="group flex flex-col items-center gap-1"
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-full border-2 backdrop-blur-md transition-transform active:scale-90 ${
                bookmarked
                  ? 'border-highlight bg-highlight text-highlight-foreground shadow-neo-sm'
                  : 'border-white/30 bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
            </span>
            <span className="text-[10px] font-bold drop-shadow">Simpan</span>
          </button>

          {/* 4. Koleksi */}
          <button
            type="button"
            onClick={() => setShowCollection(true)}
            className="group flex flex-col items-center gap-1"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/30 bg-black/50 text-white backdrop-blur-md transition-transform hover:bg-black/70 active:scale-90">
              <FolderPlus size={18} />
            </span>
            <span className="text-[10px] font-bold drop-shadow">Koleksi</span>
          </button>

          {/* 5. Ambil Foto / Frame HD (BARU) */}
          <button
            type="button"
            onClick={handleCaptureFrame}
            className="group flex flex-col items-center gap-1"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/30 bg-black/50 text-white backdrop-blur-md transition-transform hover:bg-black/70 active:scale-90">
              {captured ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Camera size={18} />
              )}
            </span>
            <span className="text-[10px] font-bold drop-shadow">
              {captured ? 'Tersimpan' : 'Foto HD'}
            </span>
          </button>

          {/* 6. Salin Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="group flex flex-col items-center gap-1"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/30 bg-black/50 text-white backdrop-blur-md transition-transform hover:bg-black/70 active:scale-90">
              {copied ? <Check size={18} className="text-green-400" /> : <Link2 size={18} />}
            </span>
            <span className="text-[10px] font-bold drop-shadow">
              {copied ? 'Tersalin' : 'Salin'}
            </span>
          </button>

          {/* 7. Download */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="group flex flex-col items-center gap-1"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-primary text-primary-foreground shadow-neo-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-60">
              <Download size={18} className={downloading ? 'animate-bounce' : ''} />
            </span>
            <span className="text-[10px] font-extrabold drop-shadow">
              {downloading ? 'Unduh...' : 'Download'}
            </span>
          </button>
        </div>

        {/* DRAWER KOMENTAR */}
        {showComments && (
          <div
            onClick={() => setShowComments(false)}
            className="absolute inset-0 z-30 flex flex-col justify-end bg-black/50 backdrop-blur-[2px] animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[70%] w-full flex-col rounded-t-3xl border-t-[3px] border-border bg-card text-foreground shadow-neo"
            >
              <div className="flex items-center justify-between border-b-2 border-border px-4 py-3">
                <h3 className="text-sm font-extrabold">
                  💬 Komentar ({commentsCount})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowComments(false)}
                  className="grid h-8 w-8 place-items-center rounded-full border-2 border-border bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <ClipComments
                  clipId={clip.id}
                  onCountChange={(newCount) => setCommentsCount(newCount)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showCollection && (
        <AddToCollectionSheet
          clipId={clip.id}
          open={showCollection}
          onClose={() => setShowCollection(false)}
        />
      )}

      {showUnlockModal && (
        <div
          onClick={() => setShowUnlockModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border-[3px] border-border bg-card p-5 text-foreground shadow-neo space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl border-2 border-border bg-highlight text-highlight-foreground">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Akses Terkunci</h3>
                  <p className="text-xs text-muted-foreground">
                    Masukkan kode dari TikTok untuk membuka download & screenshot HD.
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
                  <span>{redeemLoading ? 'Memeriksa...' : 'Buka Akses'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}