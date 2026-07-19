import { useDownloadManager } from "@/contexts/DownloadContext";
import { X, Download, CheckCircle, AlertCircle } from "lucide-react";

export function DownloadTray() {
  const { downloads, dismiss } = useDownloadManager();
  if (downloads.length === 0) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex flex-col gap-2 w-72 pointer-events-none">
      {downloads.map(d => (
        <div
          key={d.key}
          className="bg-black/90 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-2xl pointer-events-auto"
        >
          <div className="flex items-center gap-2 mb-1.5">
            {d.status === "done" ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            ) : d.status === "error" ? (
              <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
            ) : (
              <Download className="h-3.5 w-3.5 text-white/60 flex-shrink-0 animate-pulse" />
            )}
            <span className="flex-1 text-xs text-white/80 font-medium truncate">{d.title}</span>
            {(d.status === "done" || d.status === "error") && (
              <button
                onClick={() => dismiss(d.key)}
                className="text-white/30 hover:text-white/60 transition-colors ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {d.status === "downloading" && (
            <>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{ width: `${d.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1 text-right">{d.progress}%</p>
            </>
          )}
          {d.status === "done" && (
            <p className="text-[10px] text-green-400/70">Tersimpan di Downloads ✓</p>
          )}
          {d.status === "error" && (
            <p className="text-[10px] text-red-400/70">Download gagal</p>
          )}
        </div>
      ))}
    </div>
  );
}
