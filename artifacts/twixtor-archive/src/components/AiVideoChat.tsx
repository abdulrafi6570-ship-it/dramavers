import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiVideoChatProps {
  videoId?: number;
}

export function AiVideoChat({ videoId }: AiVideoChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          videoId,
          history: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Keonho lagi ngambek, coba lagi bentar." },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Koneksi ke Keonho putus, coba lagi." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/8 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white/70" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Keonho Cortis</p>
          <p className="text-[11px] text-white/30">Tanya soal video ini, ketik aja</p>
        </div>
      </div>

      {messages.length > 0 && (
        <div ref={scrollRef} className="max-h-64 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-white/10 text-white"
                    : "bg-white/[0.04] text-white/80 border border-white/8"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 text-white/40 animate-spin" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-3 border-t border-white/[0.06] flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Contoh: "ini film asal mana?"'
          className="min-h-[40px] max-h-28 resize-none bg-white/[0.03] border-white/10 text-white text-sm placeholder:text-white/25"
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          size="icon"
          className="bg-white text-black hover:bg-white/90 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
