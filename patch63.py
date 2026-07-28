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

ROUTE = "artifacts/api-server/src/routes/videos.ts"

replace_once(
    ROUTE,
    '''    viewCount: v.viewCount, downloadCount: v.downloadCount, favoriteCount: v.favoriteCount,
    popularityScore: v.popularityScore ?? null,
    averageRating: avgRow?.avg ? Number(avgRow.avg) : null,''',
    '''    viewCount: v.viewCount, downloadCount: v.downloadCount, favoriteCount: v.favoriteCount,
    popularityScore: v.popularityScore ?? null,
    isOriginal: v.isOriginal ?? true, creditName: v.creditName ?? null, creditUrl: v.creditUrl ?? null,
    averageRating: avgRow?.avg ? Number(avgRow.avg) : null,''',
    "GET /videos/:id: tambah isOriginal/creditName/creditUrl di response detail",
)

print("\nSelesai patch63.")
