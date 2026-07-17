THREAD = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"
with open(THREAD, encoding="utf-8") as f:
    content = f.read()

# Tambah padding bawah yang lebih besar di scroll area
old = '"flex-1 overflow-y-auto space-y-2 pb-4"'
new = '"flex-1 overflow-y-auto space-y-2 pb-36"'
if old in content:
    content = content.replace(old, new, 1)
    print("[OK] fix padding bawah scroll area")
else:
    import re
    content = re.sub(
        r'(overflow-y-auto[^"]*?)pb-\d+',
        r'\1pb-36',
        content, count=1
    )
    print("[OK] fix padding bawah (pola alternatif)")

with open(THREAD, "w", encoding="utf-8") as f:
    f.write(content)

print("Selesai patch35.")
