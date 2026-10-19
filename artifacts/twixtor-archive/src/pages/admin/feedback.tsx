import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { MessageCircle, CheckCircle2, Eye, Clock, Volume2, Film } from "lucide-react";

interface FeedbackItem {
  id: number;
  userId: number | null;
  username: string | null;
  message: string;
  imageUrl: string | null;
  mimeType: string | null;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:      { label: "Baru",       color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  read:     { label: "Dibaca",     color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  resolved: { label: "Selesai",    color: "text-green-400 bg-green-400/10 border-green-400/20" },
};

export default function AdminFeedback() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") { setLocation("/admin/login"); return; }
    loadFeedback();
  }, [user, authLoading]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch("/api/admin/feedback", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("twixtor_token");
    await fetch(`/api/admin/feedback/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status }),
    });
    setItems((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
  };

  const newCount = items.filter((f) => f.status === "new").length;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-6 max-w-3xl">

        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="h-5 w-5 text-white/40" />
          <div>
            <h1 className="font-miner text-base text-white">Pesan User</h1>
            <p className="text-[11px] text-white/30">
              {loading ? "Memuat..." : `${items.length} pesan · ${newCount} belum dibaca`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="h-10 w-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Belum ada pesan masuk</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id}
                className={`rounded-2xl border p-4 transition-all ${item.status === "new" ? "border-white/15 bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-semibold flex-shrink-0">
                      {(item.username ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{item.username ?? "Anonim"}</p>
                      <p className="text-[10px] text-white/25">
                        {new Date(item.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_LABELS[item.status]?.color ?? ""}`}>
                    {STATUS_LABELS[item.status]?.label ?? item.status}
                  </span>
                </div>

                {item.message && (
                  <p className="text-sm text-white/70 leading-relaxed mb-3 pl-9">{item.message}</p>
                )}

                {item.imageUrl && (() => {
                  const url = item.imageUrl;
                  const mime = item.mimeType ?? "";
                  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
                  const isAudio = mime.startsWith("audio/") ||
                    ["webm", "ogg", "m4a", "mp3", "wav"].includes(ext) ||
                    url.includes("audio");
                  const isVideo = (mime.startsWith("video/") ||
                    ["mp4", "mov", "mkv", "avi"].includes(ext)) && !isAudio;
                  const isImage = !isAudio && !isVideo;

                  return (
                    <div className="pl-9 mb-3">
                      {isImage && (
                        <button onClick={() => setSelectedImage(url)}
                          className="rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors max-w-[200px]">
                          <img src={url} alt="attachment" className="w-full object-cover max-h-40" />
                        </button>
                      )}
                      {isVideo && (
                        <div className="rounded-xl overflow-hidden border border-white/10 max-w-[280px]">
                          <video src={url} controls className="w-full max-h-48 object-cover bg-black" />
                        </div>
                      )}
                      {isAudio && (
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 max-w-[280px]">
                          <Volume2 className="h-4 w-4 text-white/30 flex-shrink-0" />
                          <audio src={url} controls className="flex-1 h-8" style={{ filter: "invert(0.7)" }} />
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center gap-2 pl-9">
                  {item.status !== "read" && (
                    <button onClick={() => updateStatus(item.id, "read")}
                      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-yellow-400 transition-colors px-2 py-1 rounded-lg hover:bg-yellow-400/10">
                      <Eye className="h-3 w-3" />
                      Tandai dibaca
                    </button>
                  )}
                  {item.status !== "resolved" && (
                    <button onClick={() => updateStatus(item.id, "resolved")}
                      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-green-400 transition-colors px-2 py-1 rounded-lg hover:bg-green-400/10">
                      <CheckCircle2 className="h-3 w-3" />
                      Selesai
                    </button>
                  )}
                  {item.status === "resolved" && (
                    <button onClick={() => updateStatus(item.id, "new")}
                      className="flex items-center gap-1 text-[11px] text-white/30 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-400/10">
                      <Clock className="h-3 w-3" />
                      Buka lagi
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
