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

ADMIN = "artifacts/twixtor-archive/src/pages/admin/videos.tsx"

replace_once(
    ADMIN,
    'import { Plus, Pencil, Trash2, Check, ChevronLeft, Film, Star } from "lucide-react";',
    'import { Plus, Pencil, Trash2, Check, ChevronLeft, Film, Star, Sparkles, Copyright } from "lucide-react";',
    "import ikon Sparkles & Copyright",
)

replace_once(
    ADMIN,
    '''  resolution?: string;
  fps?: number;
  tags: string;
};''',
    '''  resolution?: string;
  fps?: number;
  tags: string;
  isOriginal: boolean;
  creditName?: string;
  creditUrl?: string;
};''',
    "tambah field CR di tipe VideoForm",
)

replace_once(
    ADMIN,
    'const emptyForm: VideoForm = { title: "", type: "slomo", status: "draft", tags: "" };',
    'const emptyForm: VideoForm = { title: "", type: "slomo", status: "draft", tags: "", isOriginal: true };',
    "default isOriginal = true di form kosong",
)

replace_once(
    ADMIN,
    '''      resolution: form.resolution || undefined,
      fps: form.fps || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
    };''',
    '''      resolution: form.resolution || undefined,
      fps: form.fps || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      isOriginal: form.isOriginal,
      creditName: form.isOriginal ? null : (form.creditName || undefined),
      creditUrl: form.isOriginal ? null : (form.creditUrl || undefined),
    };''',
    "buildPayload: kirim field CR",
)

replace_once(
    ADMIN,
    '''                            resolution: video.resolution ?? "",
                            fps: video.fps ?? undefined,
                            tags: (video.tags ?? []).join(", "),
                          });''',
    '''                            resolution: video.resolution ?? "",
                            fps: video.fps ?? undefined,
                            tags: (video.tags ?? []).join(", "),
                            isOriginal: (video as any).isOriginal ?? true,
                            creditName: (video as any).creditName ?? "",
                            creditUrl: (video as any).creditUrl ?? "",
                          });''',
    "isi ulang field CR pas edit video",
)

replace_once(
    ADMIN,
    '''            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-black/40 border-white/10 text-white" placeholder="twixtor, slowmo, kiss" />
            </div>
          </div>''',
    '''            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-black/40 border-white/10 text-white" placeholder="twixtor, slowmo, kiss" />
            </div>

            {/* Sumber Video: Buatan Sendiri vs CR */}
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-2 block">Sumber Video</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isOriginal: true })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.isOriginal
                      ? "bg-primary/20 border-primary/60 text-primary"
                      : "border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Buatan Sendiri
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isOriginal: false })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    !form.isOriginal
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
                      : "border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  <Copyright className="h-4 w-4" />
                  CR (Kredit)
                </button>
              </div>
            </div>

            {!form.isOriginal && (
              <>
                <div className="col-span-2">
                  <label className="text-xs text-white/50 mb-1 block">Nama/Sumber Kredit</label>
                  <Input
                    value={form.creditName ?? ""}
                    onChange={(e) => setForm({ ...form, creditName: e.target.value })}
                    className="bg-black/40 border-amber-500/20 text-white"
                    placeholder="e.g. @originaluploader atau nama channel"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/50 mb-1 block">Link Sumber (opsional)</label>
                  <Input
                    value={form.creditUrl ?? ""}
                    onChange={(e) => setForm({ ...form, creditUrl: e.target.value })}
                    className="bg-black/40 border-amber-500/20 text-white"
                    placeholder="https://..."
                  />
                </div>
              </>
            )}
          </div>''',
    "pasang toggle CR + input nama/link kredit di form admin",
)

print("\nSelesai patch60: form admin punya toggle Buatan Sendiri / CR.")
