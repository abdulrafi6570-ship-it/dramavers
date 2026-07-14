import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Heart, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DonationSettings {
  dana_number: string;
  gopay_number: string;
  saweria_url: string;
  donation_qr_url: string;
}

const DEFAULT_SETTINGS: DonationSettings = {
  dana_number: "",
  gopay_number: "",
  saweria_url: "https://saweria.co/twixtorarchive",
  donation_qr_url: "",
};

interface FloatingHeart {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
}

function HeartParticles() {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  useEffect(() => {
    setHearts(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 12 + 8,
        delay: Math.random() * 3,
        duration: Math.random() * 3 + 4,
      }))
    );
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute select-none"
          style={{ left: `${h.x}%`, bottom: -20, fontSize: h.size, opacity: 0 }}
          animate={{ y: [0, -420], opacity: [0, 0.5, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "easeOut" }}
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
}

export function DonationModal({ open, onClose }: DonationModalProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string>("qris");
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_SETTINGS);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const keys = ["dana_number", "gopay_number", "saweria_url", "donation_qr_url"];
        const results = await Promise.all(
          keys.map((k) => fetch(`/api/settings/${k}`).then((r) => r.json()))
        );
        const s: DonationSettings = { ...DEFAULT_SETTINGS };
        keys.forEach((k, i) => {
          if (results[i]?.value) (s as any)[k] = results[i].value;
        });
        setSettings(s);
      } catch {}
    }
    if (open) loadSettings();
  }, [open]);

  type MethodId = "qris" | "dana" | "gopay" | "saweria";

  interface DonationMethod {
    id: MethodId;
    name: string;
    type: "transfer" | "link";
    account?: string;
    accountLabel?: string;
    url?: string;
    gradient: string;
    icon: string;
    description: string;
  }

  const METHODS: DonationMethod[] = [
    {
      id: "qris",
      name: "QRIS",
      type: "link",
      gradient: "from-purple-500/20 to-pink-500/20",
      icon: "⬜",
      description: "Scan & Pay",
    },
    {
      id: "dana",
      name: "DANA",
      type: "transfer",
      account: settings.dana_number || "Belum diset",
      accountLabel: "No. HP DANA",
      gradient: "from-blue-500/20 to-cyan-500/20",
      icon: "💙",
      description: "Transfer via DANA",
    },
    {
      id: "gopay",
      name: "GoPay",
      type: "transfer",
      account: settings.gopay_number || "Belum diset",
      accountLabel: "No. HP GoPay",
      gradient: "from-green-500/20 to-emerald-500/20",
      icon: "💚",
      description: "Transfer via GoPay",
    },
    {
      id: "saweria",
      name: "Saweria",
      type: "link",
      url: settings.saweria_url,
      gradient: "from-orange-500/20 to-yellow-500/20",
      icon: "🧡",
      description: "Support via Saweria",
    },
  ];

  const active = METHODS.find((m) => m.id === selected)!;

  function handleCopy() {
    if (!active.account || active.account === "Belum diset") return;
    navigator.clipboard.writeText(active.account);
    setCopied(true);
    toast({ title: "✅ Tersalin!", description: `${active.account} telah disalin.` });
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative w-full max-w-md"
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Animated gradient border glow */}
            <motion.div
              className="absolute -inset-[1.5px] rounded-[26px] opacity-80"
              style={{ background: "linear-gradient(135deg, #a855f7, #ec4899, #06b6d4, #a855f7)", backgroundSize: "300% 300%" }}
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Modal body */}
            <div
              className="relative rounded-[24px] overflow-hidden"
              style={{ background: "rgba(8,8,16,0.95)", backdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <HeartParticles />

              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>❤️</span> Support Twixtor Archive
                    </h2>
                    <p className="text-white/45 text-sm mt-1.5 leading-relaxed max-w-xs">
                      Jika archive ini membantu editing kamu, pertimbangkan untuk mendukung project ini.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Donation methods */}
              <div className="px-6 pt-4 pb-2">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Pilih Metode</p>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map((method) => (
                    <motion.button
                      key={method.id}
                      onClick={() => setSelected(method.id)}
                      className={`relative rounded-xl p-3 text-left transition-all border ${
                        selected === method.id
                          ? "border-white/20 bg-white/8"
                          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/6 hover:border-white/12"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {selected === method.id && (
                        <motion.div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${method.gradient} opacity-60`}
                          layoutId="methodBg"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className="relative">
                        <span className="text-xl">{method.icon}</span>
                        <p className="font-bold text-white text-sm mt-1">{method.name}</p>
                        <p className="text-white/40 text-[11px]">{method.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Active method detail */}
              <div className="px-6 py-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    {active.type === "transfer" ? (
                      <div className={`rounded-xl p-4 bg-gradient-to-br ${active.gradient} border border-white/10`}>
                        <p className="text-xs text-white/40 mb-1">{active.accountLabel}</p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-lg font-bold text-white tracking-wider">
                            {active.account}
                          </span>
                          {active.account !== "Belum diset" && (
                            <motion.button
                              onClick={handleCopy}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                              whileTap={{ scale: 0.95 }}
                            >
                              <AnimatePresence mode="wait">
                                {copied ? (
                                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                                    <Check className="h-3 w-3 text-green-400" /> Tersalin
                                  </motion.span>
                                ) : (
                                  <motion.span key="copy" className="flex items-center gap-1">
                                    <Copy className="h-3 w-3" /> Salin
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          )}
                        </div>
                        <p className="text-xs text-white/30 mt-2">a/n Twixtor Archive</p>
                      </div>
                    ) : active.id === "qris" ? (
                      <div className={`rounded-xl p-4 bg-gradient-to-br ${active.gradient} border border-white/10`}>
                        <div className="flex flex-col items-center gap-3 py-2">
                          {settings.donation_qr_url ? (
                            <img
                              src={settings.donation_qr_url}
                              alt="QR Code Donasi"
                              className="w-40 h-40 object-contain rounded-xl border border-white/10"
                            />
                          ) : (
                            <div className="w-40 h-40 rounded-xl bg-white flex items-center justify-center">
                              <div className="grid grid-cols-3 gap-1.5 p-2">
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <div key={i} className={`w-9 h-9 rounded-sm ${[0,2,6,8,4].includes(i) ? "bg-gray-900" : "bg-gray-300"}`} />
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-white/50 text-center">
                            Scan QR untuk membayar via aplikasi apapun
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`rounded-xl p-4 bg-gradient-to-br ${active.gradient} border border-white/10`}>
                        <a
                          href={active.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-bold text-white">{active.name}</p>
                            <p className="text-xs text-white/50 mt-0.5 break-all">{active.url}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
                        </a>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
                  <Heart className="h-3.5 w-3.5 text-pink-400 flex-shrink-0 fill-pink-400" />
                  <p className="text-xs text-white/35 leading-relaxed">
                    Setiap donasi, besar atau kecil, membantu menjaga archive ini tetap hidup. Terima kasih telah mendukung komunitas ❤️
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
