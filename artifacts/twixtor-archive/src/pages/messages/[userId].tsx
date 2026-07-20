import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Send, Lock, Reply, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ReplySnippet {
  id: number;
  message: string;
  deleted: boolean;
  isMine: boolean;
}

interface Msg {
  id: number;
  senderId: number;
  recipientId: number;
  message: string;
  deleted: boolean;
  createdAt: string;
  isMine: boolean;
  replyToId: number | null;
  replyTo: ReplySnippet | null;
}

export default function ChatThread() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchThread = async () => {
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch(`/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) { setBlocked(true); return; }
      if (res.ok) setMessages(await res.json());

      const profRes = await fetch(`/api/users/${userId}`);
      if (profRes.ok) {
        const prof = await profRes.json();
        setPartnerName(prof.username);
        setPartnerPhoto(prof.photoUrl ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchThread();
    pollRef.current = setInterval(fetchThread, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    const currentReply = replyTo;
    setInput("");
    setReplyTo(null);
    setSending(true);
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: text,
          ...(currentReply ? { replyToId: currentReply.id } : {}),
        }),
      });
      if (res.ok) setMessages((prev) => [...prev, await res.json()]);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: number) => {
    const token = localStorage.getItem("twixtor_token");
    const res = await fetch(`/api/messages/msg/${msgId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, deleted: true, message: "" } : m)
      );
    }
  };

  const handleReplyClick = (msg: Msg) => {
    setReplyTo(msg);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="max-w-2xl w-full mx-auto px-4 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 py-3 border-b border-white/10 bg-background shrink-0">
          <button onClick={() => window.history.back()} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href={`/users/${userId}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-sm font-bold text-white shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              {partnerPhoto
                ? <img src={partnerPhoto} className="w-full h-full object-cover" alt={partnerName} />
                : partnerName.charAt(0).toUpperCase()}
            </div>
          </Link>
          <Link href={`/users/${userId}`}>
            <h1 className="font-heading text-lg text-white hover:text-white/80 transition-colors">
              @{partnerName || "..."}
            </h1>
          </Link>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : blocked ? (
          <div className="glass-panel rounded-2xl p-8 text-center mt-8">
            <Lock className="w-10 h-10 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-sm">
              Akun ini privat. Kalian harus saling follow (berteman) dulu sebelum bisa chat.
            </p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 py-4">
              {messages.map((m) => {
                const mine = user ? String(m.senderId) === String(user.id) : m.isMine;
                return (
                  <div key={m.id} className={`flex items-end gap-2 group ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && (
                      <div className="w-6 h-6 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {partnerPhoto
                          ? <img src={partnerPhoto} className="w-full h-full object-cover" alt={partnerName} />
                          : partnerName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className={`flex flex-col gap-0.5 max-w-[75%] ${mine ? "items-end" : "items-start"}`}>
                      {/* Reply quote */}
                      {m.replyTo && (
                        <div className={`px-2 py-1 rounded-lg border-l-2 border-white/20 bg-white/[0.04] text-xs text-white/35 max-w-full ${mine ? "border-l-0 border-r-2 text-right" : ""}`}>
                          <span className="text-white/45">{m.replyTo.isMine ? "Kamu" : `@${partnerName}`}</span>
                          {" · "}
                          <span>{m.replyTo.deleted ? "chat telah di hapus" : m.replyTo.message}</span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        style={!m.deleted && mine ? { backgroundColor: "#7c3aed" } : {}}
                        className={`px-4 py-2 rounded-2xl text-sm ${
                          m.deleted
                            ? "bg-white/[0.04] text-white/20 italic border border-white/[0.04]"
                            : mine
                              ? "rounded-br-sm text-white"
                              : "glass-panel text-white/90 rounded-bl-sm"
                        }`}
                      >
                        {m.deleted ? "chat telah di hapus" : m.message}
                      </div>

                      {/* Time + actions */}
                      <div className={`flex items-center gap-1.5 px-1 ${mine ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] text-white/20">{fmt(m.createdAt)}</span>
                        {!m.deleted && (
                          <div className="hidden group-hover:flex items-center gap-1.5">
                            <button
                              onClick={() => handleReplyClick(m)}
                              className="text-white/20 hover:text-white/50 transition-colors"
                              title="Balas"
                            >
                              <Reply className="h-3 w-3" />
                            </button>
                            {mine && (
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="text-white/20 hover:text-red-400 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex flex-col gap-2 py-2 pb-20 border-t border-white/10 bg-background shrink-0">
              {replyTo && (
                <div className="flex items-center gap-2 bg-white/[0.05] rounded-lg px-3 py-1.5 border border-white/[0.07]">
                  <Reply className="h-3 w-3 text-white/35 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-white/50 font-medium">
                      {replyTo.isMine ? "Pesanmu" : `@${partnerName}`}
                    </span>
                    <p className="text-[11px] text-white/25 truncate">{replyTo.message}</p>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-white/20 hover:text-white/50 flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                    if (e.key === "Escape") setReplyTo(null);
                  }}
                  placeholder="Tulis pesan..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30 px-2"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-40"
                  style={{ backgroundColor: "#7c3aed" }}
                >
                  <Send size={18} color="white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
