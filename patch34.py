THREAD = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"
with open(THREAD, encoding="utf-8") as f:
    content = f.read()

old = '"bg-primary text-white rounded-br-sm"'
new = '"rounded-br-sm text-white"'

if old in content:
    # Ganti className string dan tambah inline style di elemen yang sama
    content = content.replace(
        '`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${\n'
        '                        mine\n'
        '                          ? "bg-primary text-white rounded-br-sm"\n'
        '                          : "glass-panel text-white/90 rounded-bl-sm"\n'
        '                      }`',
        '`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${\n'
        '                        mine\n'
        '                          ? "rounded-br-sm text-white"\n'
        '                          : "glass-panel text-white/90 rounded-bl-sm"\n'
        '                      }`',
        1
    )
    # Tambahkan inline style di div bubble yang sama
    content = content.replace(
        'className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${',
        'style={mine ? { backgroundColor: "#7c3aed" } : {}}\n'
        '                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${',
        1
    )
    print("[OK] fix warna bubble pesan sendiri")
else:
    # Pola alternatif — langsung replace apapun yang ada bg-primary di bubble
    import re
    content = re.sub(
        r'"bg-primary text-white([^"]*)"',
        '"text-white\\1"',
        content
    )
    # Cari div bubble dan tambahkan style
    content = re.sub(
        r'(className=\{`max-w-\[75%\][^`]+`\})',
        'style={mine ? { backgroundColor: "#7c3aed" } : {}} \\1',
        content,
        count=1
    )
    print("[OK] fix warna bubble (pola alternatif)")

with open(THREAD, "w", encoding="utf-8") as f:
    f.write(content)

print("Selesai patch34.")
