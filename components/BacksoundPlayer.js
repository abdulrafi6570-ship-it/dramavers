'use client';
import { useEffect, useRef, useState } from 'react';
import { Music, VolumeX } from 'lucide-react';

export default function BacksoundPlayer({ enabled, url }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!enabled || !url || !ref.current) return;
    ref.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setBlocked(true)); // browser nolak autoplay bersuara, tunggu klik user
  }, [enabled, url]);

  if (!enabled || !url) return null;

  function toggle() {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
      setPlaying(false);
    } else {
      ref.current.play().then(() => {
        setPlaying(true);
        setBlocked(false);
      }).catch(() => {});
    }
  }

  return (
    <>
      <audio ref={ref} src={url} loop />
      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-30 h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg text-muted-foreground hover:text-primary transition"
        title={playing ? 'Matikan musik latar' : 'Putar musik latar'}
      >
        {playing ? <Music size={16} className="animate-pulse text-primary" /> : <VolumeX size={16} />}
      </button>
      {blocked && !playing && (
        <span className="sr-only">Browser memblokir autoplay, tap tombol musik untuk mulai.</span>
      )}
    </>
  );
}
