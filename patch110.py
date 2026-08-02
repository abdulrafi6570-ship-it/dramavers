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

VIDEOS_PATH = "artifacts/twixtor-archive/src/pages/admin/videos.tsx"

add_file(
    "artifacts/twixtor-archive/src/components/admin/BulkVideoUploadDialog.tsx",
    "bulk-video-upload-dialog.tsx",
    "Add BulkVideoUploadDialog component",
)

replace_once(
    VIDEOS_PATH,
    'import { Plus, Pencil, Trash2, Check, ChevronLeft, Film, Star, Sparkles, Copyright } from "lucide-react";',
    'import { Plus, Pencil, Trash2, Check, ChevronLeft, Film, Star, Sparkles, Copyright, Upload } from "lucide-react";\nimport { BulkVideoUploadDialog } from "@/components/admin/BulkVideoUploadDialog";',
    "Import Upload icon + BulkVideoUploadDialog into admin videos page",
)

replace_once(
    VIDEOS_PATH,
    """        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white flex-1">Video Management</h1>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />Add
          </Button>
        </div>""",
    """        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white flex-1">Video Management</h1>
          <Button variant="outline" onClick={() => setShowBulkUpload(true)} className="border-white/20 text-white hover:bg-white/10">
            <Upload className="h-4 w-4 mr-2" />Bulk Upload
          </Button>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />Add
          </Button>
        </div>

        <BulkVideoUploadDialog
          open={showBulkUpload}
          onOpenChange={setShowBulkUpload}
          onDone={() => qc.invalidateQueries()}
        />""",
    "Add Bulk Upload button + render dialog",
)

replace_once(
    VIDEOS_PATH,
    "  const qc = useQueryClient();",
    "  const qc = useQueryClient();\n  const [showBulkUpload, setShowBulkUpload] = useState(false);",
    "Add showBulkUpload state",
)

print("\nAll patches applied successfully.")
