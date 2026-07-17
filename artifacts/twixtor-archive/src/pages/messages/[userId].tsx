import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Msg {
  id: number;
  senderId: number;
  recipientId: number;
  message: string;
  createdAt: string;
  isMine: boolean;
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
  const [partnerPhotoBroken, setPartnerPhotoBroken] = useState(false);

  useEffect(() => {
    setPartnerPhotoBroken(false);
  }, [partnerPhoto]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setInput("");
    setSending(true);
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="max-w-2xl w-full mx-auto px-4 pt-24 pb-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/messages" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-sm font-bold text-white shrink-0">
            {partnerPhoto
              ? <img src={partnerPhoto} className="w-full h-full object-cover" alt={partnerName}
              onError={() => setPartnerPhotoBroken(true)} />
              : partnerName.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-heading text-lg text-white">@{partnerName || "..."}</h1>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm">Memuat...</p>
        ) : blocked ? (
          <div className="glass-panel rounded-2xl p-8 text-center mt-8">
            <Lock className="w-10 h-10 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-sm">
              Akun ini privat. Kalian harus saling follow (berteman) dulu sebelum bisa chat.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 pb-4">
              {messages.map((m) => {
                const mine = user ? String(m.senderId) === String(user.id) : m.isMine;
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && (
                      <div className="w-6 h-6 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {partnerPhoto
                          ? <img src={partnerPhoto} className="w-full h-full object-cover" alt={partnerName}
              onError={() => setPartnerPhotoBroken(true)} />
                          : partnerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                        mine
                          ? "bg-primary text-white rounded-br-sm"
                          : "glass-panel text-white/90 rounded-bl-sm"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 sticky bottom-20 md:bottom-4 bg-background/80 backdrop-blur-md p-2 rounded-xl border border-white/10">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
          </>
        )}
      </div>
    </div>
  );
}
