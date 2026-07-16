import { useEffect, useRef, useState } from "react";
import { Music2, VolumeX } from "lucide-react";

interface BgmPlayerProps {
  src: string;
}

export function BgmPlayer({ src }: BgmPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !src) return;
    const audio = audioRef.current;
    audio.volume = 0.3;
    audio.loop = true;

    const tryPlay = () => {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    };
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    return () => document.removeEventListener("click", tryPlay);
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  };

  if (!src) return null;

  return (
    <>
      <audio ref={audioRef} src={src} preload="none" />
      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-[500] w-11 h-11 rounded-full glass-panel-strong border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-lg"
        title={playing ? "Matikan musik" : "Nyalakan musik"}
      >
        {playing ? (
          <Music2 className="w-5 h-5 text-white/80" />
        ) : (
          <VolumeX className="w-5 h-5 text-white/40" />
        )}
      </button>
    </>
  );
}
