import sys, os, shutil

def replace_once(path, old, new, label):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        print(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
        sys.exit(1)
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

def add_file(dest, source, label):
    if os.path.exists(dest):
        print(f"[FAIL] {label}: {dest} already exists — refusing to overwrite")
        sys.exit(1)
    if not os.path.exists(source):
        print(f"[FAIL] {label}: source file {source} not found next to this script")
        sys.exit(1)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy(source, dest)
    print(f"[OK] {label}")

VIDEO_PATH = "artifacts/twixtor-archive/src/pages/videos/[id].tsx"
APP_TSX = "artifacts/twixtor-archive/src/App.tsx"
PROFILE_PATH = "artifacts/twixtor-archive/src/pages/profile/index.tsx"

add_file(
    "artifacts/twixtor-archive/src/components/AddToCollectionDialog.tsx",
    "add-to-collection-dialog.tsx",
    "Add AddToCollectionDialog component",
)

add_file(
    "artifacts/twixtor-archive/src/pages/collections/index.tsx",
    "collections-index-page.tsx",
    "Add collections list page",
)

add_file(
    "artifacts/twixtor-archive/src/pages/collections/[id].tsx",
    "collection-detail-page.tsx",
    "Add collection detail page",
)

replace_once(
    VIDEO_PATH,
    'import { ArrowLeft, Heart, Bookmark, Download, Copy, Play, MessageCircle, Trash2, ExternalLink, CornerDownRight, X, Pencil, Copyright } from "lucide-react";',
    'import { ArrowLeft, Heart, Bookmark, Download, Copy, Play, MessageCircle, Trash2, ExternalLink, CornerDownRight, X, Pencil, Copyright, FolderPlus } from "lucide-react";\nimport { AddToCollectionDialog } from "@/components/AddToCollectionDialog";',
    "Import FolderPlus icon + AddToCollectionDialog into video page",
)

replace_once(
    VIDEO_PATH,
    "  const [showDownloadModal, setShowDownloadModal] = useState(false);",
    "  const [showDownloadModal, setShowDownloadModal] = useState(false);\n  const [showCollectionDialog, setShowCollectionDialog] = useState(false);",
    "Add showCollectionDialog state",
)

replace_once(
    VIDEO_PATH,
    """                <Button
                  variant="outline"
                  onClick={handleBookmark}
                  className={`border-white/15 hover:bg-white/8 ${video.isBookmarked ? "text-blue-400 border-blue-400/30" : "text-white"}`}
                >
                  <Bookmark className="h-4 w-4" fill={video.isBookmarked ? "currentColor" : "none"} />
                </Button>
              </div>""",
    """                <Button
                  variant="outline"
                  onClick={handleBookmark}
                  className={`border-white/15 hover:bg-white/8 ${video.isBookmarked ? "text-blue-400 border-blue-400/30" : "text-white"}`}
                >
                  <Bookmark className="h-4 w-4" fill={video.isBookmarked ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCollectionDialog(true)}
                  className="border-white/15 text-white hover:bg-white/8"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>

              <AddToCollectionDialog videoId={id} open={showCollectionDialog} onOpenChange={setShowCollectionDialog} />""",
    "Add 'Add to Collection' button + render dialog",
)

replace_once(
    APP_TSX,
    'import WatchHistory from "@/pages/watch-history/index";',
    'import WatchHistory from "@/pages/watch-history/index";\nimport Collections from "@/pages/collections/index";\nimport CollectionDetail from "@/pages/collections/[id]";',
    "Import Collections pages into App.tsx",
)

replace_once(
    APP_TSX,
    '<Route path="/watch-history" component={WatchHistory} />',
    '<Route path="/watch-history" component={WatchHistory} />\n      <Route path="/collections" component={Collections} />\n      <Route path="/collections/:id" component={CollectionDetail} />',
    "Register /collections routes",
)

replace_once(
    PROFILE_PATH,
    """            { href: "/history", label: "History", desc: "Previously downloaded" },
            { href: "/watch-history", label: "Riwayat Tontonan", desc: "Video yang pernah kamu tonton" },
          ].map((item) => (""",
    """            { href: "/history", label: "History", desc: "Previously downloaded" },
            { href: "/watch-history", label: "Riwayat Tontonan", desc: "Video yang pernah kamu tonton" },
            { href: "/collections", label: "Koleksi", desc: "Folder video buatanmu sendiri" },
          ].map((item) => (""",
    "Add Koleksi quick link on profile page",
)

print("\nAll patches applied successfully.")
