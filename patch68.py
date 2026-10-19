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

PAGE = "artifacts/twixtor-archive/src/pages/auth/login.tsx"

replace_once(
    PAGE,
    '''              <p className="text-white/20 text-xs">
                Admin?{" "}
                <Link href="/admin/login" className="text-white/35 hover:text-white/55 transition-colors">
                  Login admin →
                </Link>
              </p>
            </div>''',
    '''            </div>''',
    "hapus link 'Login admin' dari halaman login publik",
)

print("\nSelesai patch68: link 'Login admin' udah gak nampak lagi di halaman login publik.")
