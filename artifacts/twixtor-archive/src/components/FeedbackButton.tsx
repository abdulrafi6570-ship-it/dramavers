import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, CheckCircle2 } from "lucide-react";
import { FeedbackPromptBox } from "@/components/ui/ai-prompt-box";
import { useAuth } from "@/contexts/AuthContext";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const constraintsRef = useRef(null);
  const panelConstraintsRef = useRef(null);

  const handleSend = async (message: string, attachmentUrl?: string, mimeType?: string) => {
    if (!message && !attachmentUrl) return;
    setSending(true);
    try {
      const token = localStorage.getItem("twixtor_token");
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: message || "", attachmentUrl, mimeType }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => { setSent(false); setOpen(false); }, 2200);
      }
    } finally {
      setSending(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[39]" />
      <div ref={panelConstraintsRef} className="fixed inset-4 pointer-events-none z-[49]" />

      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={panelConstraintsRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 md:bottom-20 right-4 md:right-24 z-50 w-[min(340px,calc(100vw-2rem))] touch-none"
            style={{ cursor: "grab" }}
            whileDrag={{ cursor: "grabbing" }}
          >
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div>
                  <p className="font-heading text-sm text-white">Pesan ke Admin</p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {user ? `Hi, ${user.username}` : "Kirim sebagai anonim"} · teks, foto, video, atau vn
                  </p>
                </div>
                <button onClick={() => !sending && setOpen(false)}
                  className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="p-3">
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div key="sent"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8 gap-2">
                      <CheckCircle2 className="h-10 w-10 text-green-400" />
                      <p className="text-white/80 text-sm font-medium">Terkirim!</p>
                      <p className="text-white/30 text-xs">Admin akan baca pesanmu</p>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <FeedbackPromptBox
                        onSend={handleSend}
                        isLoading={sending}
                        placeholder="Min ini gabisa... / Tambahin ini dong... / Dll"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="hidden md:block fixed bottom-6 right-16 z-40 select-none"
      >
        <div className="relative">
          <motion.button
            onClick={() => setOpen((o) => !o)}
            whileTap={{ scale: 0.95 }}
            className="h-12 w-12 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl flex items-center justify-center shadow-lg hover:bg-white/15 transition-colors"
            aria-label="Kirim pesan ke admin"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <X className="h-5 w-5 text-white/70" />
                </motion.div>
              ) : (
                <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <MessageCircle className="h-5 w-5 text-white/70" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
            onClick={(e) => { e.stopPropagation(); setHidden(true); setOpen(false); }}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-zinc-800 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:bg-zinc-700 transition-colors z-10"
            title="Sembunyikan"
            style={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <X className="h-2.5 w-2.5" />
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
