import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Globe, Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<GlobalMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/chat", { headers: authHeader() });
        if (res.ok) setMsgs(await res.json());
      } finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

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
      }
    } finally { setSending(false); }
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <Navbar />

      <div className="max-w-2xl w-full mx-auto px-4 flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 py-3 border-b border-white/10 bg-background shrink-0">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 py-4 px-1">
          {loading ? (
            <p className="text-white/30 text-xs text-center py-12">Memuat...</p>
          ) : msgs.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-12">
              Belum ada pesan. Jadilah yang pertama!
            </p>
          ) : (
            <div className="flex flex-col justify-end min-h-full space-y-1">
              {msgs.map((m, i) => {
                const isMine = user != null && Number(user.id) === Number(m.userId);
                const prevMsg = msgs[i - 1];
                const isFirstInGroup = !prevMsg || prevMsg.userId !== m.userId;

                if (isMine) {
                  return (
                    <div key={m.id} className={`flex justify-end ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                      <div className="max-w-[72%] flex flex-col items-end">
                        {isFirstInGroup && (
                          <span className="text-[10px] text-white/30 mb-1 mr-1">{timeAgo(m.createdAt)}</span>
                        )}
                        <div className="rounded-2xl rounded-tr-sm px-3.5 py-2" style={{ backgroundColor: "#7c3aed" }}>
                          <p className="text-sm text-white break-words">{m.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className={`flex items-end gap-2 ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                    <div className="w-7 h-7 shrink-0 self-end">
                      {isFirstInGroup && (
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white">
                          {m.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="max-w-[72%] flex flex-col">
                      {isFirstInGroup && (
                        <div className="flex items-baseline gap-1.5 mb-1 ml-1">
                          <span className="text-[11px] font-semibold text-primary">{m.username}</span>
                          <span className="text-[10px] text-white/30">{timeAgo(m.createdAt)}</span>
                        </div>
                      )}
                      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3.5 py-2">
                        <p className="text-sm text-white/85 break-words">{m.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 py-2 pb-20 border-t border-white/10 bg-background shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Kirim pesan ke semua..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30 px-2"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-40"
            style={{ backgroundColor: "#7c3aed" }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
