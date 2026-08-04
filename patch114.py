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
    """                          const isDrama = !!video.dramaId;
                          setUploadMode(isDrama ? "drama" : "solo");""",
    """                          // Only treat as "solo" when there's an actor but genuinely no
                          // drama — a video with neither set (e.g. fresh from bulk upload)
                          // should default to "drama" mode so admin can freely pick either.
                          const isSolo = !video.dramaId && !!video.actorId;
                          setUploadMode(isSolo ? "solo" : "drama");""",
    "Fix Solo/Drama mode detection for videos with no drama/actor set yet",
)

print("\nAll patches applied successfully.")
