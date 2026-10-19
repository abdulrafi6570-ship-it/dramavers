def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

# Ganti tombol lama dengan toggle switch on/off
replace_once(
    "artifacts/twixtor-archive/src/pages/profile/index.tsx",
    """            {/* Toggle Privasi */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <button
                onClick={handlePrivacyToggle}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  (u.isPrivate ?? false)
                    ? "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                }`}
              >
                {(u.isPrivate ?? false)
                  ? <><Lock className="h-3 w-3" /> Akun Privat</>
                  : <><Globe className="h-3 w-3" /> Akun Publik</>
                }
              </button>
              <span className="text-[10px] text-white/25">
                {(u.isPrivate ?? false) ? "Hanya teman yang bisa lihat favorit" : "Siapapun bisa lihat favorit kamu"}
              </span>
            </div>""",
    """            {/* Toggle Privasi */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              {(u.isPrivate ?? false)
                ? <Lock className="h-3.5 w-3.5 text-white/50" />
                : <Globe className="h-3.5 w-3.5 text-white/30" />
              }
              <span className="text-xs text-white/50 w-20">
                {(u.isPrivate ?? false) ? "Akun Privat" : "Akun Publik"}
              </span>
              {/* Toggle switch */}
              <button
                onClick={handlePrivacyToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  (u.isPrivate ?? false) ? "bg-white/80" : "bg-white/15"
                }`}
                role="switch"
                aria-checked={u.isPrivate ?? false}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-lg transition duration-200 ease-in-out ${
                    (u.isPrivate ?? false) ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-[10px] text-white/25 max-w-[120px] leading-tight">
                {(u.isPrivate ?? false) ? "Hanya teman yang bisa lihat favorit" : "Siapapun bisa lihat favorit kamu"}
              </span>
            </div>""",
    "ganti tombol privasi jadi toggle switch",
)

print("SELESAI!")
