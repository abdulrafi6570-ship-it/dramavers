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
    'import { useState } from "react";',
    'import { useState, useRef } from "react";',
    "tambah import useRef",
)

replace_once(
    PAGE,
    'import { Link } from "wouter";',
    'import { Link, useLocation } from "wouter";',
    "tambah import useLocation dari wouter",
)

replace_once(
    PAGE,
    '  const [error, setError] = useState("");',
    '''  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const secretTapCount = useRef(0);
  const secretTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger rahasia: tap teks "ARCHIVE" 5x cepat buat masuk ke halaman admin login
  const handleSecretTap = () => {
    secretTapCount.current += 1;
    if (secretTapTimer.current) clearTimeout(secretTapTimer.current);
    if (secretTapCount.current >= 5) {
      secretTapCount.current = 0;
      setLocation("/admin/login");
      return;
    }
    secretTapTimer.current = setTimeout(() => {
      secretTapCount.current = 0;
    }, 2000);
  };''',
    "tambah logic hitung tap rahasia",
)

replace_once(
    PAGE,
    '''        <div className="font-brand text-3xl tracking-[0.12em] text-white">TWIXTOR</div>
        <div className="text-[10px] tracking-[0.5em] text-white/30 mt-0.5">ARCHIVE</div>''',
    '''        <div className="font-brand text-3xl tracking-[0.12em] text-white">TWIXTOR</div>
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSecretTap(); }}
          className="text-[10px] tracking-[0.5em] text-white/30 mt-0.5 select-none"
        >
          ARCHIVE
        </div>''',
    "pasang trigger tap rahasia di teks ARCHIVE",
)

print("\nSelesai patch69: tap 'ARCHIVE' 5x cepat di halaman login buat masuk admin login.")
