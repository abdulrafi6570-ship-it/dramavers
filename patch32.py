import re

THREAD = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"
with open(THREAD, encoding="utf-8") as f:
    content = f.read()

changed = False

# Fix 1: isMine — pakai langsung dari backend, jangan hitung ulang dari user.id
# (user.id bisa string vs number, jadi !== tidak cocok)
old_mine = re.search(r"const mine = user \? m\.senderId === user\.id : m\.isMine;", content)
if old_mine:
    content = content.replace(old_mine.group(0), "const mine = m.isMine;", 1)
    print("[OK] fix isMine pakai m.isMine langsung")
    changed = True
else:
    print("[SKIP] isMine sudah benar atau polanya beda")

# Fix 2: tombol kirim — pastikan ada icon Send dan warna primary
old_btn = re.search(
    r'<button\s[^>]*onClick=\{handleSend\}[^>]*>\s*\n?\s*<Send[^/]*/>\s*\n?\s*</button>',
    content, re.DOTALL
)
if old_btn:
    new_btn = (
        '<button\n'
        '              onClick={handleSend}\n'
        '              disabled={sending || !input.trim()}\n'
        '              style={{ background: "var(--color-primary, #7c3aed)" }}\n'
        '              className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0 text-white"\n'
        '            >\n'
        '              <Send className="w-5 h-5" />\n'
        '            </button>'
    )
    content = content.replace(old_btn.group(0), new_btn, 1)
    print("[OK] fix tombol kirim styling")
    changed = True
else:
    # Coba pola lain
    old_btn2 = re.search(r'className="[^"]*bg-primary[^"]*"[^>]*>\s*\n?\s*<Send', content, re.DOTALL)
    if old_btn2:
        content = content.replace(
            'className="w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 shrink-0"',
            'style={{ background: "var(--color-primary, #7c3aed)" }} className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0 text-white"',
            1
        )
        print("[OK] fix tombol kirim className")
        changed = True
    else:
        print("[SKIP] tombol kirim tidak ditemukan dengan pola ini")

if changed:
    with open(THREAD, "w", encoding="utf-8") as f:
        f.write(content)

print("\nSelesai patch32.")
