import re

THREAD = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"
with open(THREAD, encoding="utf-8") as f:
    content = f.read()

# Ganti struktur layout utama: fixed header + fixed input + scroll hanya di tengah
# Cari wrapper div utama setelah Navbar
old_wrap = re.search(
    r'<div className="min-h-screen bg-background flex flex-col">\s*<Navbar />',
    content
)
if old_wrap:
    # Ganti className wrapper + sembunyikan Navbar (pakai fixed header sendiri)
    content = content.replace(
        '<div className="min-h-screen bg-background flex flex-col">\n      <Navbar />',
        '<div className="h-screen bg-background flex flex-col overflow-hidden">\n      <Navbar />',
        1
    )
    print("[OK] fix wrapper jadi h-screen overflow-hidden")

# Fix inner container: hapus pt-24 pb-4, pakai flex col full height
old_inner = re.search(r'className="max-w-2xl w-full mx-auto px-4 pt-24 pb-4 flex-1 flex flex-col"', content)
if old_inner:
    content = content.replace(
        'className="max-w-2xl w-full mx-auto px-4 pt-24 pb-4 flex-1 flex flex-col"',
        'className="max-w-2xl w-full mx-auto px-4 flex-1 flex flex-col overflow-hidden"',
        1
    )
    print("[OK] fix inner container")

# Fix header: tambah sticky top + background
old_header = re.search(r'<div className="flex items-center gap-3 mb-4">', content)
if old_header:
    content = content.replace(
        '<div className="flex items-center gap-3 mb-4">',
        '<div className="flex items-center gap-3 py-3 border-b border-white/10 bg-background/95 backdrop-blur-md sticky top-0 z-10">',
        1
    )
    print("[OK] fix header jadi sticky")

# Fix scroll area: full flex-1 overflow
old_scroll = re.search(r'"flex-1 overflow-y-auto space-y-2 pb-\d+"', content)
if old_scroll:
    content = content.replace(
        old_scroll.group(0),
        '"flex-1 overflow-y-auto space-y-3 py-4 min-h-0"',
        1
    )
    print("[OK] fix scroll area")

# Fix input bar: sticky bottom, tidak di luar container
old_input_bar = re.search(
    r'className="flex items-center gap-2 sticky bottom-\d+[^"]*"',
    content
)
if old_input_bar:
    content = content.replace(
        old_input_bar.group(0),
        'className="flex items-center gap-2 py-2 border-t border-white/10 bg-background/95 backdrop-blur-md"',
        1
    )
    print("[OK] fix input bar jadi bottom tetap")

with open(THREAD, "w", encoding="utf-8") as f:
    f.write(content)

print("\nSelesai patch36.")
