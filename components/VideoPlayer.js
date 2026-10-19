'use client';

import { useRef, useState } from 'react';
import { Play, Camera, Check } from 'lucide-react';

export default function VideoPlayer({ src, poster, clipId }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    if (!viewed && clipId) {
      setViewed(true);
      fetch(`/api/clips/${clipId}/view`, { method: 'POST' }).catch(() => {});
    }
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 50);
  };

  // Fungsi Mengambil Screenshot Frame HD dari Video
  const handleCaptureFrame = async (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || capturing) return;

    setCapturing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `dramavers-frame-${Date.now()}.png`;
        a.click();
        setCaptured(true);
        setTimeout(() => setCaptured(false), 2000);
      } catch {
        // Fallback jika terkena proteksi CORS dari domain eksternal
        const tempVideo = document.createElement('video');
        tempVideo.crossOrigin = 'anonymous';
        tempVideo.src = clipId ? `/api/clips/${clipId}/download` : src;
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
        a.download = `dramavers-frame-${Date.now()}.png`;
        a.click();
        setCaptured(true);
        setTimeout(() => setCaptured(false), 2000);
      }
    } catch {
      alert('Pastikan kode akses download sudah dibuka untuk mengambil screenshot HD.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="group relative aspect-video w-full bg-black overflow-hidden select-none"
    >
      {playing ? (
        <>
          <video
            ref={videoRef}
            src={src}
            poster={poster || undefined}
            controls
            controlsList="nodownload"
            disablePictureInPicture={false}
            playsInline
            onContextMenu={(e) => e.preventDefault()}
            className="h-full w-full object-contain"
          />

          {/* Tombol Ambil Foto / Screenshot Frame HD */}
          <button
            type="button"
            onClick={handleCaptureFrame}
            disabled={capturing}
            title="Simpan Foto Adegan Ini (HD)"
            className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-xl border-2 border-border bg-card/90 px-2.5 py-1.5 text-[11px] font-extrabold text-foreground shadow-neo-sm backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground active:translate-y-0.5"
          >
            {captured ? (
              <>
                <Check size={13} className="text-green-600" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Camera size={13} />
                <span>{capturing ? 'Memotret...' : 'Ambil Foto'}</span>
              </>
            )}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="group relative h-full w-full block"
          aria-label="Putar Video"
        >
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt="Thumbnail"
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              src={src}
              preload="metadata"
              muted
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              className="h-full w-full object-cover pointer-events-none"
            />
          )}
          <div className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/30">
            <span className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-border bg-white text-black shadow-neo-sm transition-transform group-hover:scale-105">
              <Play size={22} fill="currentColor" className="ml-0.5" />
            </span>
          </div>
        </button>
      )}
    </div>
  );
}