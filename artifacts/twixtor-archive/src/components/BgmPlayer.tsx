import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, ChevronDown } from "lucide-react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import musicAnim from "@assets/lottieflow-multimedia-8-8-000000-easey_1781367392571.json";
import muteAnim from "@assets/lottieflow-multimedia-8-9-000000-easey_1781367392639.json";
import volAnim from "@assets/lottieflow-multimedia-8-14-000000-easey_1781367392781.json";
import playStopAnim from "@assets/lottieflow-multimedia-8-11-000000-easey_1781367392876.json";

interface BgmPlayerProps {
  src: string;
}

function LottieIcon({
  anim,
  size = 16,
  playing = true,
}: {
  anim: object;
  size?: number;
  playing?: boolean;
}) {
  const ref = useRef<LottieRefCurrentProps>(null);
  useEffect(() => {
    if (playing) ref.current?.play();
    else ref.current?.pause();
  }, [playing]);
  return (
    <Lottie
      lottieRef={ref}
      animationData={anim}
      loop
      autoplay={playing}
      style={{ width: size, height: size, filter: "invert(1)", opacity: 0.5 }}
    />
  );
}

export function BgmPlayer({ src }: BgmPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const constraintsRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setVisible(true), 3000);
  }, []);

  useEffect(() => {
    if (!audioRef.current || !src) return;
    const audio = audioRef.current;
    audio.volume = 0.3;
    audio.loop = true;

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    }

    const tryPlay = () => {
      audio.play()
        .then(() => {
          setPlaying(true);
          if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = null;
          }
        })
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
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  if (!src) return null;

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[498]" />
      <audio ref={audioRef} src={src} preload="none" />
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        className="fixed bottom-6 left-4 z-[500] touch-none select-none transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20, cursor: "grab" }}
        whileDrag={{ cursor: "grabbing", scale: 1.02 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {minimized ? (
            <motion.button
              key="minimized"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMinimized(false)}
              className="glass-panel-strong rounded-full w-9 h-9 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
              title="Expand BGM player"
            >
              <Music2 className="w-4 h-4 text-white/50" style={{ filter: playing ? "none" : "opacity(0.3)" }} />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="glass-panel-strong rounded-full px-3 py-2 flex items-center gap-2 border border-white/10"
            >
              <LottieIcon anim={musicAnim} size={14} playing={playing} />
              <button
                onClick={toggleMute}
                className="hover:opacity-100 transition-opacity flex items-center"
                title={muted ? "Unmute" : "Mute"}
              >
                <LottieIcon anim={muted ? muteAnim : volAnim} size={18} playing />
              </button>
              <button
                onClick={toggle}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  playing ? "bg-white/20" : "bg-white/5"
                }`}
                title={playing ? "Pause" : "Play"}
              >
                <LottieIcon anim={playStopAnim} size={14} playing={playing} />
              </button>
              <button
                onClick={() => setMinimized(true)}
                className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
