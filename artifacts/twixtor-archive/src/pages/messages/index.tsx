import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { Globe, MessageCircle, Pin } from "lucide-react";

interface GlobalMsg {
  id: number; userId: number; username: string; message: string; createdAt: string;
}
interface Conversation {
  userId: number; username: string; photoUrl: string | null;
  lastMessage: string; lastMessageAt: string; isMine: boolean; unreadCount: number;
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

function authHeader() {
  const token = localStorage.getItem("twixtor_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MessagesInbox() {
  const [lastGlobal, setLastGlobal] = useState<GlobalMsg | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [dmLoading, setDmLoading] = useState(true);
  const [brokenPhotos, setBrokenPhotos] = useState<Set<number>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/chat", { headers: authHeader() });
        if (res.ok) {
          const msgs: GlobalMsg[] = await res.json();
          if (msgs.length > 0) setLastGlobal(msgs[msgs.length - 1]);
        }
      } catch {}
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/messages/conversations", { headers: authHeader() });
        if (res.ok) setConversations(await res.json());
      } finally { setDmLoading(false); }
    };
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-28 md:pb-12">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-white">Pesan</h1>
        </div>

        <div className="space-y-0.5">
          <Link
            href="/messages/global"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 active:bg-white/8 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">Global Chat</span>
                  <Pin className="w-3 h-3 text-primary/60" />
                </div>
                {lastGlobal && (
                  <span className="text-[11px] text-white/40 shrink-0">{timeAgo(lastGlobal.createdAt)}</span>
                )}
              </div>
              <p className="text-xs text-white/50 truncate mt-0.5">
                {lastGlobal
                  ? `${lastGlobal.username}: ${lastGlobal.message}`
                  : "Ruang obrolan semua pengguna"}
              </p>
            </div>
          </Link>

          <div className="border-t border-white/5 my-2" />

          {dmLoading ? (
            <p className="text-white/40 text-sm px-3 py-4">Memuat...</p>
          ) : conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">
                Belum ada DM.{" "}
                <span className="text-primary">Tap Chat</span> di profil temanmu.
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.userId}
                href={`/messages/${c.userId}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 active:bg-white/8 transition-colors"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {c.photoUrl && !brokenPhotos.has(c.userId) ? (
                    <img
                      src={c.photoUrl}
                      className="w-full h-full object-cover"
                      alt={c.username}
                      onError={() =>
                        setBrokenPhotos((prev) => {
                          const s = new Set(prev);
                          s.add(c.userId);
                          return s;
                        })
                      }
                    />
                  ) : (
                    c.username.charAt(0).toUpperCase()
                  )}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
