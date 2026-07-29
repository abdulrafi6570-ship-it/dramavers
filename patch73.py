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

HOME = "artifacts/twixtor-archive/src/pages/home/index.tsx"

replace_once(
    HOME,
    '''        </section>

        {/* ── Recent Clips — Carousel ── */}''',
    '''        </section>

        {/* ── Dramas — Netflix-style poster row ── */}
        {featuredDramas.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-base font-semibold text-white">Dramas</h2>
              <Link href="/dramas" className="text-xs text-white/40 hover:text-white transition-colors">Lihat semua →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {featuredDramas.map((drama: any) => (
                <Link
                  key={drama.id}
                  href={`/dramas/${drama.id}`}
                  className="flex-shrink-0 w-28 md:w-36 group"
                >
                  <div className="w-28 h-40 md:w-36 md:h-52 rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-primary/40 transition-colors">
                    {drama.posterUrl ? (
                      <img
                        src={drama.posterUrl}
                        alt={drama.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl font-bold">
                        {drama.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/70 group-hover:text-white transition-colors truncate">
                    {drama.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Recent Clips — Carousel ── */}''',
    "tambah section Dramas gaya Netflix di Home",
)

print("\nSelesai patch73.")
