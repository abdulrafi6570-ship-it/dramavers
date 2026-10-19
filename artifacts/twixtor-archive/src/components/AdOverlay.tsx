import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface Ad {
  id: number;
  type: "image" | "video";
  mediaUrl: string;
  title?: string | null;
  description?: string | null;
  durationSeconds?: number | null;
  linkUrl?: string | null;
}

interface AdOverlayProps {
  ad: Ad;
  onClose: () => void;
}

export function AdOverlay({ ad, onClose }: AdOverlayProps) {
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);

    if (ad.type === "image") {
      const dur = ad.durationSeconds ?? 5;
      setCountdown(dur);
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(interval); setCanClose(true); return 0; }
          return c - 1;
        });
      }, 1000);
      return () => { clearTimeout(timer); clearInterval(interval); };
    }

    return () => clearTimeout(timer);
  }, [ad]);

  const handleVideoEnded = () => setCanClose(true);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    if (ad.linkUrl) window.open(ad.linkUrl, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-[8888] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
        paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
      }}
    >
      <div
        className="relative w-full max-w-lg"
        style={{ animation: visible ? "adSlideIn 0.35s ease-out forwards" : "none" }}
      >
        {/* Glass card */}
        <div className="glass-panel-strong rounded-2xl overflow-hidden border border-white/10">
          {/* Close button — top-right, with safe area */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {!canClose && countdown > 0 && (
              <span className="text-xs text-white/50 bg-black/50 px-2 py-1 rounded-full">
                {countdown}s
              </span>
            )}
            <button
              onClick={canClose ? handleClose : undefined}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                canClose
                  ? "bg-white/20 hover:bg-white/30 cursor-pointer text-white"
                  : "bg-white/5 cursor-not-allowed text-white/20"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Ad badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="text-[10px] text-white/40 bg-black/50 px-2 py-0.5 rounded-full tracking-widest">
              IKLAN
            </span>
          </div>

          {/* Media */}
          <div
            className={`relative ${ad.linkUrl ? "cursor-pointer" : ""}`}
            onClick={ad.linkUrl ? handleClick : undefined}
          >
            {ad.type === "video" ? (
              <video
                ref={videoRef}
                src={ad.mediaUrl}
                autoPlay
                onEnded={handleVideoEnded}
                className="w-full max-h-[60vh] object-cover"
                playsInline
              />
            ) : (
              <img
                src={ad.mediaUrl}
                alt={ad.title ?? "Ad"}
                className="w-full max-h-[60vh] object-cover"
              />
            )}
          </div>

          {/* Text content */}
          {(ad.title || ad.description) && (
            <div className="p-5">
              {ad.title && <h2 className="text-xl font-bold text-white mb-1">{ad.title}</h2>}
              {ad.description && <p className="text-sm text-white/60">{ad.description}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
