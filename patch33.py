import re

THREAD = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"
with open(THREAD, encoding="utf-8") as f:
    content = f.read()

changed = False

# Fix 1: isMine — pakai senderId vs user.id (yang terbukti benar sebelum patch32)
# Tapi pakai String() biar type mismatch aman
old = "const mine = m.isMine;"
new = "const mine = user ? String(m.senderId) === String(user.id) : m.isMine;"
if old in content:
    content = content.replace(old, new, 1)
    print("[OK] fix isMine pakai String comparison")
    changed = True
else:
    # Coba ganti pola lama juga kalau ada
    old2 = "const mine = user ? m.senderId === user.id : m.isMine;"
    new2 = "const mine = user ? String(m.senderId) === String(user.id) : m.isMine;"
    if old2 in content:
        content = content.replace(old2, new2, 1)
        print("[OK] fix isMine String comparison (pola 2)")
        changed = True
    else:
        print("[WARN] pola isMine tidak ditemukan")

# Fix 2: tombol kirim — ganti semua button kirim agar berwarna dan ada icon
btn_old = re.search(
    r'<button\s[^>]*onClick=\{handleSend\}[^>]*>.*?</button>',
    content, re.DOTALL
)
btn_new = (
    '<button\n'
    '              onClick={handleSend}\n'
    '              disabled={sending || !input.trim()}\n'
    '              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center disabled:opacity-40"\n'
    '              style={{ backgroundColor: "#7c3aed" }}\n'
    '            >\n'
    '              <Send size={18} color="white" />\n'
    '            </button>'
)
if btn_old:
    content = content.replace(btn_old.group(0), btn_new, 1)
    print("[OK] fix tombol kirim")
    changed = True
else:
    print("[WARN] tombol kirim tidak ditemukan")

if changed:
    with open(THREAD, "w", encoding="utf-8") as f:
        f.write(content)

print("\nSelesai patch33.")
