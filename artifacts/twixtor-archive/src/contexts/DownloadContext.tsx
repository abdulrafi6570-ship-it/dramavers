import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface DownloadItem {
  key: string;
  videoId: number;
  title: string;
  progress: number;
  status: "downloading" | "done" | "error";
}

interface DownloadContextType {
  downloads: DownloadItem[];
  startDownload: (videoId: number, title: string, url: string) => void;
  dismiss: (key: string) => void;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const startDownload = useCallback(async (videoId: number, title: string, url: string) => {
    const key = `${videoId}_${Date.now()}`;
    const safeName = title.replace(/[^a-zA-Z0-9\u00C0-\uFFFF _-]/g, "").trim() || "video";
    const filename = safeName + "_" + Date.now() + ".mp4";

    setDownloads(prev => [...prev, { key, videoId, title, progress: 0, status: "downloading" }]);

    try {
      const response = await fetch(url);
      if (!response.ok || !response.body) throw new Error("Fetch gagal");
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : null;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) {
          const pct = Math.round((received / total) * 100);
          setDownloads(prev => prev.map(d => d.key === key ? { ...d, progress: pct } : d));
        }
      }

      const blob = new Blob(chunks, { type: "video/mp4" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

      setDownloads(prev => prev.map(d => d.key === key ? { ...d, progress: 100, status: "done" } : d));
      // Auto-hilang setelah 4 detik
      setTimeout(() => setDownloads(prev => prev.filter(d => d.key !== key)), 4000);
    } catch {
      setDownloads(prev => prev.map(d => d.key === key ? { ...d, status: "error" } : d));
    }
  }, []);

  const dismiss = useCallback((key: string) => {
    setDownloads(prev => prev.filter(d => d.key !== key));
  }, []);

  return (
    <DownloadContext.Provider value={{ downloads, startDownload, dismiss }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownloadManager() {
  const ctx = useContext(DownloadContext);
  if (!ctx) throw new Error("useDownloadManager must be inside DownloadProvider");
  return ctx;
}
