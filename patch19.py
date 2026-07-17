import re

def regex_replace_once(path, pattern, replacement, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    new_content, n = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)
    if n != 1:
        raise SystemExit(f"[FAIL] {label}: {n} match")
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"[OK] {label}")

regex_replace_once(
    "artifacts/twixtor-archive/src/components/BgmPlayer.tsx",
    r'bottom-24(\s+right-4\s+z-\[500\])',
    r'top-20\1',
    "BgmPlayer: pindah posisi ke kanan-atas",
)

regex_replace_once(
    "artifacts/twixtor-archive/src/components/FeedbackButton.tsx",
    r'drag\s*dragMomentum=\{false\}\s*dragElastic=\{0\}\s*dragConstraints=\{constraintsRef\}\s*className="fixed bottom-\[4\.5rem\][^"]*"\s*style=\{\{ cursor: "grab" \}\}\s*whileDrag=\{\{ cursor: "grabbing", scale: 1\.05 \}\}',
    r'className="hidden md:block fixed bottom-6 right-16 z-40 select-none"',
    "FeedbackButton: hilangkan drag, sembunyikan di HP",
)

print("\nOK semua.")
