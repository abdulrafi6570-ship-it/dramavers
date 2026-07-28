def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

PAGE = "artifacts/twixtor-archive/src/pages/videos/[id].tsx"

replace_once(
    PAGE,
    'import { ArrowLeft, Heart, Bookmark, Download, Copy, Play, MessageCircle, Trash2, ExternalLink, CornerDownRight, X, Pencil } from "lucide-react";',
    'import { ArrowLeft, Heart, Bookmark, Download, Copy, Play, MessageCircle, Trash2, ExternalLink, CornerDownRight, X, Pencil, Copyright } from "lucide-react";',
    "import ikon Copyright",
)

replace_once(
    PAGE,
    '''                <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-white/30 hover:text-white transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>''',
    '''                <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-white/30 hover:text-white transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* CR badge - cuma muncul kalau video BUKAN buatan sendiri */}
              {!(video as any).isOriginal && (
                <div className="glass-panel rounded-xl p-3 border border-amber-400/20 bg-amber-400/[0.03] flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                    <Copyright className="h-4 w-4 text-amber-400/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/50">Video ini hasil credit (CR) dari</p>
                    {(video as any).creditUrl ? (
                      <a href={(video as any).creditUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white hover:text-white/80 transition-colors">
                        {(video as any).creditName || "sumber lain"}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-white">{(video as any).creditName || "sumber lain"}</p>
                    )}
                  </div>
                  {(video as any).creditUrl && (
                    <a href={(video as any).creditUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-white/30 hover:text-white transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>''',
    "pasang badge CR di halaman video publik",
)

print("\nSelesai patch64: badge CR muncul di halaman video kalau video bukan buatan sendiri.")
