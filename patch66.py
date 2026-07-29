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

NAVBAR = "artifacts/twixtor-archive/src/components/layout/Navbar.tsx"

replace_once(
    NAVBAR,
    '''    {
      icon: <Film size={18} />,
      label: "Browse",
      active: location.startsWith("/videos"),
      onClick: () => setLocation("/videos"),
    },''',
    '''    {
      icon: <Film size={18} />,
      label: "Browse",
      active: location.startsWith("/dramas"),
      onClick: () => setLocation("/dramas"),
    },''',
    "tombol Browse di bottom nav sekarang ke /dramas (poster), bukan /videos (klip)",
)

print("\nSelesai patch66.")
