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
    'import { LogOut, User, LayoutDashboard, Home, Film, Users, Heart, MessageSquare } from "lucide-react";',
    'import { LogOut, User, LayoutDashboard, Home, Film, Users, Heart, MessageSquare, ChevronLeft } from "lucide-react";',
    "import ikon ChevronLeft",
)

replace_once(
    NAVBAR,
    '''        <div className="container mx-auto flex h-13 items-center px-4 md:px-6">
          {/* Logo */}''',
    '''        <div className="container mx-auto flex h-13 items-center px-4 md:px-6">
          {/* Back button */}
          {location !== "/" && (
            <button
              onClick={() => window.history.back()}
              aria-label="Kembali"
              className="mr-1.5 h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Logo */}''',
    "pasang tombol back, disembunyiin di halaman Home",
)

print("\nSelesai patch57: tombol back muncul di semua halaman kecuali Home.")
