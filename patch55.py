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
    '''  const searchContext =
    searchResults.length > 0
      ? `

Hasil pencarian judul (berdasarkan pesan user, urutkan sesuai relevansi menurutmu, maksimal sebutkan 5):
${searchResults.map((r) => `- ${r.title}${r.dramaName ? ` (${r.dramaName})` : ""}${r.actorName ? ` [${r.actorName}]` : ""} -> /videos/${r.id}`).join("\\n")}`
      : "";''',
    '''  const searchContext =
    searchResults.length > 0
      ? `

Hasil pencarian judul (SUDAH dilakukan otomatis berdasarkan pesan user ini, urutkan sesuai relevansi menurutmu, maksimal sebutkan 5):
${searchResults.map((r) => `- ${r.title}${r.dramaName ? ` (${r.dramaName})` : ""}${r.actorName ? ` [${r.actorName}]` : ""} -> /videos/${r.id}`).join("\\n")}`
      : `

Hasil pencarian judul (SUDAH dilakukan otomatis berdasarkan pesan user ini): KOSONG, gak ada video yang cocok di database sama sekali. JANGAN nanya clue/keyword lagi ke user (pencarian udah dicoba dan gagal) — langsung bilang jujur ke user kalau video/judul itu belum ada di web ini.`;''',
    "kasih tau AI bahwa pencarian selalu udah dijalanin, walau hasilnya kosong",
)

replace_once(
    AI_ROUTE,
    '- Kamu (Keonho) sendiri fungsinya bantu user: jawab soal video (judul, durasi, fps, drama/idol terkait), bantu cari judul yang mereka maksud, kasih rekomendasi link kalau nggak ketemu persis.`;',
    '''- Kamu (Keonho) sendiri fungsinya bantu user: jawab soal video (judul, durasi, fps, drama/idol terkait), bantu cari judul yang mereka maksud, kasih rekomendasi link kalau nggak ketemu persis.

Peta halaman web Twixtor Archive (pakai ini kalau user nanya "ada halaman apa aja" / "gimana caranya ke halaman X"):
- Beranda/Home (/) -> daftar video terbaru & populer
- Browse/koleksi video (ikon film di bottom nav)
- Search (/search) -> cari video/drama/aktor
- Chat Global (/chat) -> obrolan terbuka semua user
- DM -> pesan privat 1-on-1 antar user (dari profil user lain)
- Profil (/profile) -> foto profil, bio, daftar favorit, following/followers
- Request (halaman request) -> minta judul baru + tombol Support buat donasi/prioritas
- Bantuan (/bantuan) -> halaman FAQ lengkap
- Solo Artists & Drama Actors -> daftar aktor/idol yang videonya ada di web ini
- Login/Register -> wajib buat komentar, follow, DM, request`;''',
    "tambah peta halaman web ke pengetahuan AI",
)

print("\nSelesai patch55.")
