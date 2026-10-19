import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import successAnim from "@assets/lottieflow-success-08-000000-easey_1781367391892.json";

interface LoadingScreenProps {
  onDone: () => void;
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [phase, setPhase] = useState(0);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => {
      setPhase(2);
      lottieRef.current?.play();
    }, 1400);
    const t3 = setTimeout(() => setPhase(3), 2800);
    const t4 = setTimeout(() => onDone(), 3200);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
  }, [onDone]);

  const filmCells = Array.from({ length: 40 });

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#000",
        opacity: phase === 3 ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        pointerEvents: phase === 3 ? "none" : "all",
      }}
    >
      {/* Top film strip */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-[#0a0a0a] flex overflow-hidden border-b border-white/5">
        <div className="flex" style={{ animation: "filmScroll 3s linear infinite" }}>
          {filmCells.map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-8 h-6 m-2 rounded-sm border border-white/10"
              style={{ background: "rgba(255,255,255,0.02)" }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="text-center space-y-3 px-8">
        <div
          style={{
            animation: phase >= 1 ? "loadIn 0.9s ease-out forwards" : "none",
            opacity: 0,
          }}
        >
          <div className="text-5xl sm:text-7xl font-black tracking-[0.18em] text-white">
            TWIXTOR
          </div>
          <div className="text-xs sm:text-sm tracking-[0.6em] text-white/40 mt-1 font-light">
            ARCHIVE
          </div>
        </div>

        <div
          className="text-white/30 text-xs tracking-widest mt-4"
          style={{
            animation: phase >= 1 ? "loadIn 0.9s ease-out 0.4s both" : "none",
          }}
        >
          Premium Slow-Motion K-Drama Clips
        </div>

        {/* Progress bar — hides when done */}
        <div
          className="mt-8 w-40 sm:w-56 h-[1px] bg-white/10 mx-auto rounded-full overflow-hidden"
          style={{
            opacity: phase < 2 ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            className="h-full bg-white rounded-full"
            style={{
              animation: phase >= 1 ? "loadBar 1.2s ease-out forwards" : "none",
            }}
          />
        </div>

        {/* Lottie success — appears when bar finishes */}
        <div
          style={{
            marginTop: phase >= 2 ? "8px" : "0px",
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "scale(1)" : "scale(0.5)",
            transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <Lottie
            lottieRef={lottieRef}
            animationData={successAnim}
            loop={false}
            autoplay={false}
            style={{ width: 72, height: 72, filter: "invert(1)", margin: "0 auto" }}
          />
        </div>
      </div>

      {/* Bottom film strip */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#0a0a0a] flex overflow-hidden border-t border-white/5">
        <div className="flex" style={{ animation: "filmScroll 3s linear infinite reverse" }}>
          {filmCells.map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-8 h-6 m-2 rounded-sm border border-white/10"
              style={{ background: "rgba(255,255,255,0.02)" }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
