import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Globe, Send, ArrowLeft, Trash2, Reply, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

interface GlobalMsg {
  id: number; userId: number; username: string; photoUrl: string | null;
  message: string; deleted: boolean;
  replyTo: { id: number; username: string; message: string } | null;
  createdAt: string;
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

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("twixtor_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function GlobalChatPage() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<GlobalMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<GlobalMsg | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/chat", { headers: authHeader() });
        if (res.ok) {
          const data = await res.json();
          setMsgs(data);
        }
      } finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    const currentReply = replyTo;
    setSending(true);
    setInput("");
    setReplyTo(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ message: msg, ...(currentReply ? { replyToId: currentReply.id } : {}) }),
      });
      if (res.ok) {
        const data = await res.json();
        setMsgs(prev => [...prev, data]);
      }
    } finally { setSending(false); }
  };

  const handleDelete = async (msgId: number) => {
    const res = await fetch(`/api/chat/${msgId}`, { method: "DELETE", headers: authHeader() });
    if (res.ok) setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true, message: "" } : m));
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="max-w-2xl w-full mx-auto px-4 flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center gap-3 py-3 border-b border-white/10 bg-background shrink-0">
          <button onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Global Chat</p>
            <p className="text-[11px] text-white/40">Semua pengguna</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 py-4 px-1">
          {loading ? (
            <p className="text-white/30 text-xs text-center py-12">Memuat...</p>
          ) : msgs.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-12">Belum ada pesan. Jadilah yang pertama!</p>
          ) : (
            <div className="flex flex-col justify-end min-h-full space-y-1">
              {msgs.map((m, i) => {
                const isMine = user != null && Number(user.id) === Number(m.userId);
                const prevMsg = msgs[i - 1];
                const isFirst = !prevMsg || prevMsg.userId !== m.userId;

                if (isMine) return (
                  <div key={m.id} className={`flex justify-end ${isFirst ? "mt-3" : "mt-0.5"}`}>
                    <div className="max-w-[72%] flex flex-col items-end">
                      {isFirst && <span className="text-[10px] text-white/30 mb-1 mr-1">{timeAgo(m.createdAt)}</span>}
                      {m.replyTo && (
                        <div className="px-2 py-1 rounded-lg border-r-2 border-white/25 bg-white/[0.04] text-xs text-white/35 max-w-full text-right mb-1">
                          <span className="text-white/50 font-medium">@{m.replyTo.username}</span>{" · "}
                          <span>{m.replyTo.message || "pesan dihapus"}</span>
                        </div>
                      )}
                      <div className={`rounded-2xl rounded-tr-sm px-3.5 py-2 ${m.deleted ? "bg-white/[0.05] border border-white/10" : ""}`}
                        style={!m.deleted ? { backgroundColor: "#7c3aed" } : {}}>
                        <p className={`text-sm break-words ${m.deleted ? "text-white/25 italic" : "text-white"}`}>
                          {m.deleted ? "pesan dihapus" : m.message}
                        </p>
                      </div>
                      {!m.deleted && (
                        <div className="flex items-center gap-2 mt-0.5 mr-1">
                          <button onClick={() => { setReplyTo(m); setTimeout(() => inputRef.current?.focus(), 50); }}
                            className="text-white/20 hover:text-white/50 active:text-white/60 transition-colors">
                            <Reply className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleDelete(m.id)}
                            className="text-white/20 hover:text-red-400 active:text-red-500 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isFirst ? "mt-3" : "mt-0.5"}`}>
                    <div className="w-7 h-7 shrink-0 self-end">
                      {isFirst && (
                        <Link href={`/users/${m.userId}`}>
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer hover:opacity-80 overflow-hidden">
                            {m.photoUrl
                              ? <img src={m.photoUrl} alt={m.username} className="w-full h-full object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                              : m.username.charAt(0).toUpperCase()}
                          </div>
                        </Link>
                      )}
                    </div>
                    <div className="max-w-[72%] flex flex-col">
                      {isFirst && (
                        <div className="flex items-baseline gap-1.5 mb-1 ml-1">
                          <Link href={`/users/${m.userId}`}>
                            <span className="text-[11px] font-semibold text-primary cursor-pointer hover:opacity-80">{m.username}</span>
                          </Link>
                          <span className="text-[10px] text-white/30">{timeAgo(m.createdAt)}</span>
                        </div>
                      )}
                      {m.replyTo && (
                        <div className="px-2 py-1 rounded-lg border-l-2 border-white/25 bg-white/[0.04] text-xs text-white/35 max-w-full mb-1">
                          <span className="text-white/50 font-medium">@{m.replyTo.username}</span>{" · "}
                          <span>{m.replyTo.message || "pesan dihapus"}</span>
                        </div>
                      )}
                      <div className={`rounded-2xl rounded-tl-sm px-3.5 py-2 ${m.deleted ? "bg-white/[0.03] border border-white/[0.04]" : "bg-white/10"}`}>
                        <p className={`text-sm break-words ${m.deleted ? "text-white/25 italic" : "text-white/85"}`}>
                          {m.deleted ? "pesan dihapus" : m.message}
                        </p>
                      </div>
                      {!m.deleted && (
                        <div className="flex items-center gap-2 mt-0.5 ml-1">
                          <button onClick={() => { setReplyTo(m); setTimeout(() => inputRef.current?.focus(), 50); }}
                            className="text-white/20 hover:text-white/50 active:text-white/60 transition-colors">
                            <Reply className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 py-2 pb-20 border-t border-white/10 bg-background shrink-0">
          {replyTo && (
            <div className="flex items-center gap-2 bg-white/[0.05] rounded-lg px-3 py-1.5 border border-white/[0.07]">
              <Reply className="h-3 w-3 text-white/35 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-white/50 font-medium">@{replyTo.username}</span>
                <p className="text-[11px] text-white/25 truncate">{replyTo.message}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/20 hover:text-white/50 flex-shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Kirim pesan ke semua..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30 px-2" />
            <button onClick={send} disabled={!input.trim() || sending}
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-40"
              style={{ backgroundColor: "#7c3aed" }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
