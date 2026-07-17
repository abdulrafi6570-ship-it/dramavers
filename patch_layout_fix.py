import re

path = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"
with open(path, encoding="utf-8") as f:
    src = f.read()

changed = []

# 1. Wrapper luar: h-dvh flex col overflow-hidden
if re.search(r'className="(min-h-screen|h-screen)[^"]*"', src):
    src = re.sub(
        r'className="(min-h-screen|h-screen)[^"]*"',
        'className="h-dvh bg-background flex flex-col overflow-hidden"',
        src, count=1
    )
    changed.append("wrapper utama")

# 2. Inner container: flex-1 flex col overflow-hidden min-h-0
if re.search(r'className="[^"]*max-w-2xl[^"]*"', src):
    src = re.sub(
        r'className="[^"]*max-w-2xl[^"]*"',
        'className="max-w-2xl w-full mx-auto px-4 flex-1 flex flex-col overflow-hidden min-h-0"',
        src, count=1
    )
    changed.append("inner container")

# 3. Chat header (nama + back button): shrink-0
if re.search(r'className="flex items-center gap-3[^"]*"', src):
    src = re.sub(
        r'className="flex items-center gap-3[^"]*"',
        'className="flex items-center gap-3 py-3 border-b border-white/10 bg-background shrink-0"',
        src, count=1
    )
    changed.append("chat header")

# 4. Area pesan: flex-1 overflow-y-auto min-h-0 = scroll sendiri
if re.search(r'className="flex-1 overflow-y-auto[^"]*"', src):
    src = re.sub(
        r'className="flex-1 overflow-y-auto[^"]*"',
        'className="flex-1 overflow-y-auto min-h-0 space-y-3 py-4"',
        src, count=1
    )
    changed.append("area pesan (scroll sendiri)")

# 5. Input bar: shrink-0, pb-20 agar tidak ketutup bottom nav
if re.search(r'className="flex items-center gap-2[^"]*"', src):
    src = re.sub(
        r'className="flex items-center gap-2[^"]*"',
        'className="flex items-center gap-2 py-2 pb-20 border-t border-white/10 bg-background shrink-0"',
        src, count=1
    )
    changed.append("input bar")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("✓ Berhasil fix:", ", ".join(changed) if changed else "tidak ada pattern yang cocok")
