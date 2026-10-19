DM = "artifacts/twixtor-archive/src/components/DonationModal.tsx"

def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match in {path}, found {count}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

# 1. Tambah icon Download & Maximize2
replace_once(
    DM,
    'import { X, Copy, Check, Heart, ExternalLink } from "lucide-react";',
    'import { X, Copy, Check, Heart, ExternalLink, Download, Maximize2 } from "lucide-react";',
    "import icon Download & Maximize2",
)

# 2. Tambah state qrPreviewOpen
replace_once(
    DM,
    '''  const [selected, setSelected] = useState<string>("qris");
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_SETTINGS);
  const overlayRef = useRef<HTMLDivElement>(null);''',
    '''  const [selected, setSelected] = useState<string>("qris");
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<DonationSettings>(DEFAULT_SETTINGS);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);''',
    "state qrPreviewOpen",
)

# 3. Modal body: bisa di-scroll & header nempel di atas (X selalu keliatan)
replace_once(
    DM,
    '''            {/* Modal body */}
            <div
              className="relative rounded-[24px] overflow-hidden"
              style={{ background: "rgba(8,8,16,0.95)", backdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <HeartParticles />

              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-white/[0.06]">''',
    '''            {/* Modal body */}
            <div
              className="relative rounded-[24px] overflow-y-auto"
              style={{ background: "rgba(8,8,16,0.95)", backdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "85vh" }}
            >
              <HeartParticles />

              {/* Header */}
              <div
                className="sticky top-0 z-20 relative px-6 pt-6 pb-4 border-b border-white/[0.06]"
                style={{ background: "rgba(10,10,18,0.98)", backdropFilter: "blur(20px)" }}
              >''',
    "modal scrollable + header sticky",
)

# 4. Kotak QRIS: ukuran fix, tap buat perbesar, tombol download
replace_once(
    DM,
    '''                    ) : active.id === "qris" ? (
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
                    ) : (''',
    '''                    ) : active.id === "qris" ? (
                      <div className={`rounded-xl p-4 bg-gradient-to-br ${active.gradient} border border-white/10`}>
                        <div className="flex flex-col items-center gap-3 py-2">
                          {settings.donation_qr_url ? (
                            <button
                              type="button"
                              onClick={() => setQrPreviewOpen(true)}
                              className="relative rounded-xl border border-white/10 overflow-hidden group"
                              style={{ width: 168, height: 168, flexShrink: 0 }}
                              title="Tap untuk perbesar"
                            >
                              <img
                                src={settings.donation_qr_url}
                                alt="QR Code Donasi"
                                className="w-full h-full object-cover"
                                style={{ width: 168, height: 168 }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                                <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-40 h-40 rounded-xl bg-white flex items-center justify-center" style={{ flexShrink: 0 }}>
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
                          {settings.donation_qr_url && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQrPreviewOpen(true)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                              >
                                <Maximize2 className="h-3 w-3" /> Perbesar
                              </button>
                              <a
                                href={settings.donation_qr_url}
                                download="qris-donasi.jpg"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                              >
                                <Download className="h-3 w-3" /> Download
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (''',
    "kotak QRIS: ukuran fix + tap perbesar + download",
)

# 5. Tambah lightbox full-screen buat lihat QR ukuran besar
replace_once(
    DM,
    '''          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}''',
    '''          </motion.div>

          {/* QR Lightbox */}
          <AnimatePresence>
            {qrPreviewOpen && settings.donation_qr_url && (
              <motion.div
                className="fixed inset-0 z-[700] flex items-center justify-center p-6"
                style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQrPreviewOpen(false)}
              >
                <motion.div
                  className="relative max-w-sm w-full"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={settings.donation_qr_url}
                    alt="QR Code Donasi (perbesar)"
                    className="w-full max-h-[70vh] object-contain rounded-xl border border-white/10 bg-white"
                  />
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <a
                      href={settings.donation_qr_url}
                      download="qris-donasi.jpg"
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                    <button
                      type="button"
                      onClick={() => setQrPreviewOpen(false)}
                      className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                    >
                      <X className="h-4 w-4" /> Tutup
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}''',
    "tambah lightbox QR full-screen",
)

print("\nSelesai patch DonationModal.")
