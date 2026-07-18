import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Globe, Send, ArrowLeft } from "lucide-react";

interface GlobalMsg {
  id: number; userId: number; username: string; message: string; createdAt: string;
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

export default function GlobalChatPage() {
  const [msgs, setMsgs] = useState<GlobalMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/chat", { headers: authHeader() });
        if (res.ok) {
          setMsgs(await res.json());
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      } finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const send = async () => {
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
        setMsgs((prev) => [...prev, data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur border-b border-white/10 pt-16">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Global Chat</p>
            <p className="text-[11px] text-white/40">Semua pengguna</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 pt-36 pb-24 overflow-y-auto">
        {loading ? (
          <p className="text-white/30 text-xs text-center py-12">Memuat...</p>
        ) : msgs.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-12">Belum ada pesan. Jadilah yang pertama!</p>
        ) : (
          <div className="space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {m.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-primary">{m.username}</span>
                    <span className="text-[10px] text-white/30">{timeAgo(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white/80 break-words mt-0.5">{m.message}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur border-t border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Kirim pesan ke semua..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50"
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
            style={{ backgroundColor: "#7c3aed" }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
