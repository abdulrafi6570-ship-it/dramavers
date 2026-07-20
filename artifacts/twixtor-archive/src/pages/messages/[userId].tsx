import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Send, Lock, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Msg {
  id: number; senderId: number; recipientId: number;
  message: string; deleted: boolean; createdAt: string; isMine: boolean;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchThread = async () => {
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch(`/api/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { setBlocked(true); return; }
      if (res.ok) setMessages(await res.json());
      const profRes = await fetch(`/api/users/${userId}`);
      if (profRes.ok) {
        const prof = await profRes.json();
        setPartnerName(prof.username);
        setPartnerPhoto(prof.photoUrl ?? null);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!userId) return;
    fetchThread();
    pollRef.current = setInterval(fetchThread, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput(""); setSending(true);
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) setMessages(prev => [...prev, await res.json()]);
    } finally { setSending(false); }
  };

  const handleDelete = async (msgId: number) => {
    const token = localStorage.getItem("twixtor_token");
    const res = await fetch(`/api/messages/msg/${msgId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true, message: "" } : m));
  };

  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const Avatar = ({ size }: { size: "sm" | "md" }) => {
    const cls = size === "md" ? "w-9 h-9 text-sm" : "w-6 h-6 text-[10px]";
    return (
      <div className={`${cls} rounded-full overflow-hidden glass-panel-strong flex items-center justify-center font-bold text-white shrink-0`}>
        {partnerPhoto
          ? <img src={partnerPhoto} className="w-full h-full object-cover" alt={partnerName}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          : partnerName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <Navbar />
      <div className="max-w-2xl w-full mx-auto px-4 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header — klik nama/foto → ke profil partner */}
        <div className="flex items-center gap-3 py-3 border-b border-white/10 bg-background shrink-0">
          <button onClick={() => window.history.back()} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href={`/users/${userId}`} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar size="md" />
            <h1 className="font-heading text-lg text-white truncate">@{partnerName || "..."}</h1>
          </Link>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm p-4">Memuat...</p>
        ) : blocked ? (
          <div className="glass-panel rounded-2xl p-8 text-center mt-8">
            <Lock className="w-10 h-10 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-sm">Akun ini privat. Kalian harus saling follow dulu sebelum bisa chat.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-4">
              {messages.map((m) => {
                const mine = user ? String(m.senderId) === String(user.id) : m.isMine;
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && (
                      <Link href={`/users/${userId}`}>
                        <div className="cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar size="sm" />
                        </div>
                      </Link>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <div
                        style={mine && !m.deleted ? { backgroundColor: "#7c3aed" } : {}}
                        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                          m.deleted ? "bg-white/[0.03] text-white/20 italic border border-white/[0.04]"
                          : mine ? "rounded-br-sm text-white"
                          : "glass-panel text-white/90 rounded-bl-sm"
                        }`}
                      >
                        {m.deleted ? "pesan dihapus" : m.message}
                      </div>
                      {!m.deleted && (
                        <div className={`flex items-center gap-1.5 px-1 ${mine ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] text-white/20">{fmt(m.createdAt)}</span>
                          {mine && (
                            <button onClick={() => handleDelete(m.id)}
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
            <div className="flex items-center gap-2 py-2 pb-20 border-t border-white/10 bg-background shrink-0">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tulis pesan..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30 px-2" />
              <button onClick={handleSend} disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-40"
                style={{ backgroundColor: "#7c3aed" }}>
                <Send size={18} color="white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
