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
    "artifacts/twixtor-archive/src/lib/generate-video-thumbnail.ts",
    "generate-video-thumbnail.ts",
    "Add generate-video-thumbnail.ts utility",
)

replace_once(
    VIDEOS_PATH,
    'import { FileUploader } from "@/components/FileUploader";',
    'import { FileUploader } from "@/components/FileUploader";\nimport { generateThumbnailFromVideoUrl } from "@/lib/generate-video-thumbnail";',
    "Import generateThumbnailFromVideoUrl into admin videos page",
)

replace_once(
    VIDEOS_PATH,
    '<FileUploader accept="video/*" label="Pilih Video" currentUrl={form.videoUrl ?? ""} previewType="video" onUpload={(url) => setForm({ ...form, videoUrl: url })} />',
    '''<FileUploader
                accept="video/*"
                label="Pilih Video"
                currentUrl={form.videoUrl ?? ""}
                previewType="video"
                onUpload={(url) => {
                  setForm((prev) => ({ ...prev, videoUrl: url }));
                  // Auto-generate a thumbnail from the video if one hasn't
                  // been picked already — admin can still override manually.
                  if (url) {
                    generateThumbnailFromVideoUrl(url)
                      .then((thumbUrl) => {
                        setForm((prev) => (prev.thumbnailUrl ? prev : { ...prev, thumbnailUrl: thumbUrl }));
                      })
                      .catch((err) => console.error("Auto-thumbnail failed:", err));
                  }
                }}
              />''',
    "Trigger auto-thumbnail generation when video finishes uploading",
)

print("\nAll patches applied successfully.")
