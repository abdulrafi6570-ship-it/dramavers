def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

ADMIN = "artifacts/twixtor-archive/src/pages/admin/videos.tsx"

replace_once(
    ADMIN,
    '''        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">''',
    '''        <div className="glass-panel rounded-2xl border border-white/10 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">''',
    "table video management bisa di-scroll horizontal di HP, gak ke-crop lagi",
)

print("\nSelesai patch65.")
