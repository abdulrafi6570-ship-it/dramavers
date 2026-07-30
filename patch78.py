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

ACTORS = "artifacts/twixtor-archive/src/pages/admin/actors.tsx"
ADS = "artifacts/twixtor-archive/src/pages/admin/ads.tsx"
DRAMAS = "artifacts/twixtor-archive/src/pages/admin/dramas.tsx"
VIDEOS = "artifacts/twixtor-archive/src/pages/admin/videos.tsx"

replace_once(
    ACTORS,
    '<DialogContent className="glass-panel border-white/10 text-white">',
    '<DialogContent className="bg-neutral-950 border-white/10 text-white">',
    "Make Actor form modal opaque",
)

replace_once(
    ADS,
    '<DialogContent className="glass-panel-strong border border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">',
    '<DialogContent className="bg-neutral-950 border border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">',
    "Make Ads form modal opaque",
)

replace_once(
    DRAMAS,
    '<DialogContent className="glass-panel border-white/10 text-white">',
    '<DialogContent className="bg-neutral-950 border-white/10 text-white">',
    "Make Drama form modal opaque (1st dialog)",
)

replace_once(
    DRAMAS,
    '<DialogContent className="glass-panel border-white/10 text-white max-w-md">',
    '<DialogContent className="bg-neutral-950 border-white/10 text-white max-w-md">',
    "Make Drama form modal opaque (2nd dialog)",
)

replace_once(
    VIDEOS,
    '<DialogContent className="glass-panel border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">',
    '<DialogContent className="bg-neutral-950 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">',
    "Make Video form modal opaque",
)

print("\nAll patches applied successfully.")
