import re, sys

path = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"
with open(path, encoding="utf-8") as f:
    src = f.read()

# ── 1. Wrapper utama: h-dvh flex col overflow-hidden ─────────────────────────
src = re.sub(
    r'className="(min-h-screen|h-screen)[^"]*"',
    'className="h-dvh bg-background flex flex-col overflow-hidden"',
    src, count=1
)

# ── 2. Sembunyikan <Navbar /> di halaman chat ini ───────────────────────────
# Supaya header chat jadi satu-satunya header
src = re.sub(r'\s*<Navbar\s*/>', '', src, count=1)

# ── 3. Inner container: hapus pt tinggi, pakai flex-1 flex col overflow-hidden
src = re.sub(
    r'className="[^"]*max-w-2xl[^"]*"',
    'className="max-w-2xl w-full mx-auto px-4 flex-1 flex flex-col overflow-hidden"',
    src, count=1
)

# ── 4. Chat header: sticky top-0, z-10, bg solid ────────────────────────────
src = re.sub(
    r'className="flex items-center gap-3[^"]*"',
    'className="flex items-center gap-3 py-3 px-0 border-b border-white/10 bg-background shrink-0"',
    src, count=1
)

# ── 5. Area pesan: flex-1 overflow-y-auto min-h-0 (scroll sendiri) ──────────
src = re.sub(
    r'className="flex-1 overflow-y-auto[^"]*"',
    'className="flex-1 overflow-y-auto min-h-0 space-y-3 py-4 px-0"',
    src, count=1
)

# ── 6. Input bar: shrink-0, pb aman untuk bottom nav ────────────────────────
src = re.sub(
    r'className="flex items-center gap-2[^"]*"',
    'className="flex items-center gap-2 py-3 pb-24 border-t border-white/10 bg-background shrink-0"',
    src, count=1
)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("✓ Layout chat sudah difix: header tetap, scroll hanya pesan, input tetap di bawah")
