import { useState } from "react";
import { useDownloadManager, DownloadItem } from "@/contexts/DownloadContext";
import { Download, CheckCircle, AlertCircle, X, ChevronDown } from "lucide-react";

function CircleProgress({ progress, size = 52 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress / 100);
  return (
    <svg width={size} height={size} className="-rotate-90 absolute inset-0" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="white" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.25s ease" }}
      />
    </svg>
  );
}

export function DownloadTray() {
  const { downloads, dismiss } = useDownloadManager();
  const [expanded, setExpanded] = useState(false);

  if (downloads.length === 0) return null;

  const active = downloads.filter(d => d.status === "downloading");
  const done = downloads.filter(d => d.status === "done");
  const errors = downloads.filter(d => d.status === "error");

  // Progress gabungan kalau ada beberapa download aktif
  const avgProgress = active.length > 0
    ? Math.round(active.reduce((s, d) => s + d.progress, 0) / active.length)
    : 100;

  const fabStatus: "downloading" | "done" | "error" =
    active.length > 0 ? "downloading" :
    errors.length > 0 && done.length === 0 ? "error" : "done";

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 z-50 flex flex-col items-end gap-3">

      {/* Panel expanded */}
      {expanded && (
        <div className="bg-black/95 border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-2xl w-64 mb-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Download</span>
            <button onClick={() => setExpanded(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {downloads.map((d: DownloadItem) => (
              <div key={d.key} className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                  {d.status === "done" ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : d.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <div className="relative w-7 h-7">
                      <CircleProgress progress={d.progress} size={28} />
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">
                        {d.progress}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate leading-tight">{d.title}</p>
                  <p className={`text-[10px] mt-0.5 ${
                    d.status === "done" ? "text-green-400/70" :
                    d.status === "error" ? "text-red-400/70" :
                    "text-white/35"
                  }`}>
                    {d.status === "done" ? "Selesai" :
                     d.status === "error" ? "Gagal" :
                     `${d.progress}%`}
                  </p>
                </div>
                {d.status !== "downloading" && (
                  <button onClick={() => dismiss(d.key)} className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB bulat */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="relative w-[52px] h-[52px] flex items-center justify-center"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Background circle */}
        <div className={`absolute inset-0 rounded-full shadow-xl transition-colors duration-200 ${
          fabStatus === "done" ? "bg-green-500/90" :
          fabStatus === "error" ? "bg-red-500/90" :
          "bg-white/10 backdrop-blur-md"
        } border border-white/15`} />

        {/* Progress ring */}
        {fabStatus === "downloading" && (
          <CircleProgress progress={avgProgress} size={52} />
        )}

        {/* Icon */}
        <span className="relative z-10">
          {fabStatus === "done" ? (
            <CheckCircle className="h-5 w-5 text-white" />
          ) : fabStatus === "error" ? (
            <AlertCircle className="h-5 w-5 text-white" />
          ) : (
            <Download className="h-5 w-5 text-white" />
          )}
        </span>

        {/* Badge jumlah download aktif */}
        {active.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center z-20">
            {active.length}
          </span>
        )}
      </button>
    </div>
  );
}
