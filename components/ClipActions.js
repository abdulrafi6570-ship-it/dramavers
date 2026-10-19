'use client';

import { useState } from 'react';
import {
  Download,
  Link2,
  Heart,
  Bookmark,
  MessageCircle,
  FolderPlus,
  Lock,
  KeyRound,
  X,
  Check,
} from 'lucide-react';
import ClipComments from './ClipComments';
import AddToCollectionSheet from './AddToCollectionSheet';

export default function ClipActions({ clip }) {
  const [liked, setLiked] = useState(Boolean(clip.liked_by_me));
  const [likesCount, setLikesCount] = useState(clip.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(Boolean(clip.bookmarked_by_me));
  const [commentsCount, setCommentsCount] = useState(clip.comments_count || 0);

  const [showComments, setShowComments] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [copied, setCopied] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  // Mengunduh langsung di halaman yang sama tanpa membuka tab baru
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
        setShowUnlockModal(true);
        setDownloading(false);
        return;
      }

      // Gunakan endpoint download internal agar langsung ter-download di tempat
      const targetUrl = data.downloadUrl || `/api/clips/${clip.id}/download`;
      triggerSamePageDownload(targetUrl, `${clip.title || 'dramavers-clip'}.mp4`);
    } catch (err) {
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
    } catch (err) {
      setRedeemError('Gagal memverifikasi kode.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/drama/${clip.drama_id}#clip-${clip.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLike = async () => {
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikesCount((c) => (prevLiked ? Math.max(0, c - 1) : c + 1));
    try {
      await fetch(`/api/clips/${clip.id}/like`, { method: 'POST' });
    } catch {
      setLiked(prevLiked);
      setLikesCount((c) => (prevLiked ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const toggleBookmark = async () => {
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      await fetch(`/api/clips/${clip.id}/bookmark`, { method: 'POST' });
    } catch {
      setBookmarked(prev);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-neo-sm transition-all hover:opacity-95 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
        >
          <Download size={14} />
          <span>{downloading ? 'Mengunduh...' : 'Download'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Link2 size={14} />}
          <span>{copied ? 'Tersalin!' : 'Copy Link'}</span>
        </button>

        <button
          type="button"
          onClick={toggleLike}
          className={`inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-1.5 text-xs font-bold transition-colors ${
            liked
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-foreground hover:bg-muted'
          }`}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>

        <button
          type="button"
          onClick={toggleBookmark}
          className={`inline-flex items-center justify-center rounded-full border-2 p-1.5 text-xs font-bold transition-colors ${
            bookmarked
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-foreground hover:bg-muted'
          }`}
        >
          <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="inline-flex items-center gap-1 rounded-full border-2 border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
        >
          <MessageCircle size={14} />
          <span>{commentsCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCollection(true)}
          className="inline-flex items-center justify-center rounded-full border-2 border-border bg-card p-1.5 text-xs font-bold text-foreground hover:bg-muted"
        >
          <FolderPlus size={14} />
        </button>
      </div>

      {showComments && (
        <div className="pt-3 border-t border-border mt-3">
          <ClipComments
            clipId={clip.id}
            onCountChange={(newCount) => setCommentsCount(newCount)}
          />
        </div>
      )}

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
            className="w-full max-w-md rounded-3xl border-[3px] border-border bg-card p-5 shadow-neo space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl border-2 border-border bg-highlight text-highlight-foreground">
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Download Terkunci</h3>
                  <p className="text-xs text-muted-foreground">
                    Masukkan kode dari TikTok untuk membuka akses download.
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
                  className="inline-flex items-center gap-1.5 rounded-xl border-[3px] border-border bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
                >
                  <span>{redeemLoading ? 'Memeriksa...' : 'Buka & Download'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 