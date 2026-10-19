import sys

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

replace_once(
    VIDEOS_PATH,
    """          <div className="flex flex-col gap-2 mt-4">
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90" disabled={createVideo.isPending || updateVideo.isPending}>
                <Check className="h-4 w-4 mr-2" />{editId ? "Update" : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }} className="border-white/20 text-white hover:bg-white/10">Batal</Button>
            </div>""",
    """          <div className="flex flex-col gap-2 mt-4 sticky bottom-0 -mx-6 px-6 pb-4 pt-3 bg-neutral-950 border-t border-white/10">
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90" disabled={createVideo.isPending || updateVideo.isPending}>
                <Check className="h-4 w-4 mr-2" />{editId ? "Update" : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }} className="border-white/20 text-white hover:bg-white/10">Batal</Button>
            </div>""",
    "Make video form's Save/Cancel footer sticky so mobile keyboard never covers it",
)

print("\nAll patches applied successfully.")
