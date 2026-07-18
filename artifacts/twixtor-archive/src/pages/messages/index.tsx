import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { MessageCircle, Globe, Send } from "lucide-react";

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
  const [globalMsgs, setGlobalMsgs] = useState<GlobalMsg[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [dmLoading, setDmLoading] = useState(true);
  const [brokenPhotos, setBrokenPhotos] = useState<Set<number>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/chat", { headers: authHeader() });
        if (res.ok) {
          setGlobalMsgs(await res.json());
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      } finally { setGlobalLoading(false); }
    };
    load();
    const iv = setInterval(load, 5000);
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

  const sendGlobal = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        setInput("");
        const data = await res.json();
        setGlobalMsgs((prev) => [...prev, data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-28 md:pb-12 space-y-6">

        {/* ── GLOBAL CHAT ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-white/40" />
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Global Chat</p>
            <span className="text-[10px] text-white/20 ml-1">· semua pengguna</span>
          </div>

          <div className="glass-panel rounded-2xl p-3 space-y-3 mb-2 max-h-64 overflow-y-auto">
            {globalLoading ? (
              <p className="text-white/30 text-xs text-center py-4">Memuat...</p>
            ) : globalMsgs.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">Belum ada pesan. Jadilah yang pertama!</p>
            ) : (
              globalMsgs.map((m) => (
                <div key={m.id} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                    {m.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-primary">{m.username}</span>
                      <span className="text-[10px] text-white/30">{timeAgo(m.createdAt)}</span>
                    </div>
                    <p className="text-sm text-white/80 break-words">{m.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input global */}
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendGlobal()}
              placeholder="Kirim pesan ke semua..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50"
            />
            <button
              onClick={sendGlobal}
              disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
              style={{ backgroundColor: "#7c3aed" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* ── DIRECT MESSAGES ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-white/40" />
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Direct Messages</p>
          </div>

          {dmLoading ? (
            <p className="text-white/40 text-sm px-1">Memuat...</p>
          ) : conversations.length === 0 ? (
            <div className="glass-panel rounded-2xl p-6 text-center">
              <p className="text-white/40 text-sm">Belum ada DM. Tap Chat di profil temanmu.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <Link
                  key={c.userId}
                  href={`/messages/${c.userId}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {c.photoUrl && !brokenPhotos.has(c.userId) ? (
                      <img src={c.photoUrl} className="w-full h-full object-cover" alt={c.username}
                        onError={() => setBrokenPhotos((prev) => { const s = new Set(prev); s.add(c.userId); return s; })} />
                    ) : c.username.charAt(0).toUpperCase()}
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
    </div>
  );
}
