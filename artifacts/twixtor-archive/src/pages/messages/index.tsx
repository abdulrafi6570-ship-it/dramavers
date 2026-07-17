import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { MessageCircle } from "lucide-react";

interface Conversation {
  userId: number;
  username: string;
  photoUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  isMine: boolean;
  unreadCount: number;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}j`;
  return `${Math.floor(hr / 24)}h`;
}

export default function MessagesInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [brokenPhotos, setBrokenPhotos] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("twixtor_token");
        const res = await fetch("/api/messages/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setConversations(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-28 md:pb-12">
        <h1 className="font-heading text-2xl mb-6 text-white">Pesan</h1>

        {loading ? (
          <p className="text-white/40 text-sm">Memuat...</p>
        ) : conversations.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-sm">
              Belum ada percakapan. Cari akun temanmu lalu tap tombol Chat di profilnya.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link
                key={c.userId}
                href={`/messages/${c.userId}`}
                className="flex items-center gap-3 p-3 rounded-xl glass-panel border-white/5 hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-base font-bold text-white shrink-0">
                  {c.photoUrl
                    ? <img src={c.photoUrl} className="w-full h-full object-cover" alt={c.username}
                        onError={() => setBrokenPhotos((prev) => { const s = new Set(prev); s.add(c.userId); return s; })} />
                    : c.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate">@{c.username}</span>
                    <span className="text-[11px] text-white/40 shrink-0">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {c.isMine ? "Kamu: " : ""}{c.lastMessage}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
