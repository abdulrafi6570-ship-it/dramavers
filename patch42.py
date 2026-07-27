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

VIDEO_PAGE = "artifacts/twixtor-archive/src/pages/videos/[id].tsx"

replace_once(
    VIDEO_PAGE,
    'import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";',
    'import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";\nimport { AiVideoChat } from "@/components/AiVideoChat";',
    "tambah import AiVideoChat",
)

replace_once(
    VIDEO_PAGE,
    '''            </div>

            {/* Comments */}''',
    '''            </div>

            {/* AI Assistant */}
            <AiVideoChat videoId={video.id} />

            {/* Comments */}''',
    "pasang widget AiVideoChat di bawah video",
)

print("\nSelesai patch42: widget AI Keonho Cortis nempel di halaman video.")
