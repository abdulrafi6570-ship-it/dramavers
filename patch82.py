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

VIDEOS_PATH = "artifacts/twixtor-archive/src/pages/admin/videos.tsx"
COMPONENT_PATH = "artifacts/twixtor-archive/src/components/ui/input-with-tags.tsx"
COMPONENT_SOURCE = "patch82_input-with-tags.tsx"

if not os.path.exists(COMPONENT_SOURCE):
    print(f"[FAIL] {COMPONENT_SOURCE} not found — did you run step 1 first?")
    sys.exit(1)
if os.path.exists(COMPONENT_PATH):
    print(f"[FAIL] {COMPONENT_PATH} already exists — refusing to overwrite")
    sys.exit(1)
os.makedirs(os.path.dirname(COMPONENT_PATH), exist_ok=True)
shutil.copy(COMPONENT_SOURCE, COMPONENT_PATH)
print("[OK] Add input-with-tags.tsx component")

replace_once(
    VIDEOS_PATH,
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";',
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { InputWithTags } from "@/components/ui/input-with-tags";',
    "Import InputWithTags into videos.tsx",
)

replace_once(
    VIDEOS_PATH,
    "  tags: string;\n  isOriginal: boolean;",
    "  tags: string[];\n  isOriginal: boolean;",
    "Change VideoForm.tags type from string to string[]",
)

replace_once(
    VIDEOS_PATH,
    'const emptyForm: VideoForm = { title: "", type: "slomo", status: "draft", tags: "", isOriginal: true };',
    'const emptyForm: VideoForm = { title: "", type: "slomo", status: "draft", tags: [], isOriginal: true };',
    "emptyForm.tags now starts as an empty array",
)

replace_once(
    VIDEOS_PATH,
    "      tags: form.tags ? form.tags.split(\",\").map((t) => t.trim()) : [],",
    "      tags: form.tags,",
    "Save payload now sends form.tags directly (already an array)",
)

replace_once(
    VIDEOS_PATH,
    '                            tags: (video.tags ?? []).join(", "),',
    "                            tags: video.tags ?? [],",
    "Edit-populate now keeps tags as an array instead of joining to a string",
)

replace_once(
    VIDEOS_PATH,
    """            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-black/40 border-white/10 text-white" placeholder="twixtor, slowmo, kiss" />
            </div>""",
    """            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Tags</label>
              <InputWithTags value={form.tags} onChange={(tags) => setForm({ ...form, tags })} placeholder="Ketik tag lalu tekan Enter (twixtor, slowmo, kiss...)" />
            </div>""",
    "Replace plain comma-separated Tags input with interactive InputWithTags",
)

print("\nAll patches applied successfully.")
