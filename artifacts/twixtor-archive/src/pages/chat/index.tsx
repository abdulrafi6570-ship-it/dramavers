import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { MessageSquare, Send, Reply, Trash2, X } from "lucide-react";

interface ReplySnippet { id: number; username: string; message: string; }
interface ChatMessage {
  id: number; userId: number | null; username: string; photoUrl: string | null;
  message: string; deleted: boolean; replyToId: number | null;
  replyTo: ReplySnippet | null; createdAt: string;
}

export default function GlobalChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) setMessages(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !user) return;
    const text = input.trim();
    const currentReply = replyTo;
    setInput(""); setReplyTo(null); setSending(true);
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: text, ...(currentReply ? { replyToId: currentReply.id } : {}) }),
      });
      if (res.ok) setMessages(prev => [...prev, await res.json()]);
    } finally { setSending(false); }
  };

  const handleDelete = async (msgId: number) => {
    const token = localStorage.getItem("twixtor_token");
    const res = await fetch(`/api/chat/${msgId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true, message: "" } : m));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setReplyTo(null);
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-0 md:px-4 max-w-2xl flex flex-col" style={{ height: "calc(100dvh - 4rem)" }}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
          <MessageSquare className="h-5 w-5 text-white/40" />
          <div>
            <h1 className="font-semibold text-white text-sm">Global Chat</h1>
            <p className="text-[11px] text-white/30">Semua pengguna bisa chat di sini</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-32 md:pb-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="h-10 w-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Belum ada pesan. Mulai duluan!</p>
            </div>
          ) : messages.map((msg) => {
            const isMe = !!user && msg.userId !== null && Number(msg.userId) === Number(user.id);
            const profileHref = msg.userId ? `/users/${msg.userId}` : "#";
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                <Link href={profileHref}>
                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[11px] font-bold text-white/60 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden">
                    {msg.photoUrl
                      ? <img src={msg.photoUrl} alt={msg.username} className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      : msg.username.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <div className={`max-w-[72%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && !msg.deleted && (
                    <Link href={profileHref}>
                      <span className="text-[11px] text-white/35 px-1 hover:text-white/60 transition-colors cursor-pointer">{msg.username}</span>
                    </Link>
                  )}
                  {msg.replyTo && (
                    <div className={`px-2 py-1 rounded-lg border-l-2 border-white/25 bg-white/[0.04] text-xs text-white/35 max-w-full ${isMe ? "border-l-0 border-r-2 text-right" : ""}`}>
                      <span className="text-white/50 font-medium">@{msg.replyTo.username}</span>
                      {" · "}
                      <span className="truncate">{msg.replyTo.message || "pesan dihapus"}</span>
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                    msg.deleted ? "bg-white/[0.03] text-white/20 italic border border-white/[0.04]"
                    : isMe ? "bg-white text-black rounded-tr-sm"
                    : "bg-white/[0.07] text-white/85 rounded-tl-sm border border-white/[0.06]"
                  }`}>
                    {msg.deleted ? "pesan dihapus" : msg.message}
                  </div>
                  {!msg.deleted && (
                    <div className={`flex items-center gap-2 px-1 mt-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className="text-[10px] text-white/20">{fmt(msg.createdAt)}</span>
                      <button onClick={() => { setReplyTo(msg); setTimeout(() => inputRef.current?.focus(), 50); }}
                        className="text-white/20 hover:text-white/50 active:text-white/60 transition-colors">
                        <Reply className="h-3 w-3" />
                      </button>
                      {isMe && (
                        <button onClick={() => handleDelete(msg.id)}
                          className="text-white/20 hover:text-red-400 active:text-red-500 transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="fixed bottom-[4.5rem] md:bottom-0 left-0 right-0 md:relative border-t border-white/[0.06] bg-background px-4 py-3 flex-shrink-0 max-w-2xl mx-auto w-full">
          {!user ? (
            <div className="text-center text-sm text-white/30 py-2">
              <Link href="/login" className="text-white/60 hover:text-white underline">Masuk</Link> untuk ikut chat
            </div>
          ) : (
            <div className="flex flex-col gap-2">
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
              <div className="flex gap-2 items-end">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey} placeholder="Ketik pesan..." rows={1}
                  className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-white/20 transition-colors"
                  style={{ maxHeight: "120px", overflowY: "auto" }} />
                <button onClick={handleSend} disabled={!input.trim() || sending}
                  className="h-10 w-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-white/90 active:scale-95 transition-all">
                  <Send className="h-4 w-4 text-black" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
