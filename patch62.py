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

AI_ROUTE = "artifacts/api-server/src/routes/ai.ts"

replace_once(
    AI_ROUTE,
    '''- Judul video: ${v.title}
- Drama/Series: ${d?.name ?? "tidak ada"}''',
    '''- Judul video: ${v.title}
- Status buatan: ${v.isOriginal === false ? `CR (credit dari ${v.creditName ?? "sumber lain"})` : "buatan sendiri"}
- Drama/Series: ${d?.name ?? "tidak ada"}''',
    "tambah info CR/original ke konteks video buat AI",
)

print("\nSelesai patch62.")
