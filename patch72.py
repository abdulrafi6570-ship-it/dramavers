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

HOME = "artifacts/api-server/src/routes/home.ts"

replace_once(
    HOME,
    '''      .where(eq(videosTable.status, "published"))
      .orderBy(desc(videosTable.popularityScore), desc(videosTable.downloadCount)).limit(12),''',
    '''      .where(eq(videosTable.status, "published"))
      .orderBy(desc(videosTable.viewCount), desc(videosTable.popularityScore), desc(videosTable.downloadCount)).limit(12),''',
    "Popular Clips diurutin dari viewCount dulu",
)

print("\nSelesai patch72.")
