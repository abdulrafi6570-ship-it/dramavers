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
    '''  const conditions = keywords.flatMap((kw) => [
    ilike(videosTable.title, `%${kw}%`),
    ilike(dramasTable.name, `%${kw}%`),
  ]);

  const rows = await db
    .select({
      id: videosTable.id,
      title: videosTable.title,
      dramaName: dramasTable.name,
    })
    .from(videosTable)
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .where(or(...conditions))
    .orderBy(desc(videosTable.popularityScore))
    .limit(8);

  return rows;''',
    '''  const conditions = keywords.flatMap((kw) => [
    ilike(videosTable.title, `%${kw}%`),
    ilike(dramasTable.name, `%${kw}%`),
    ilike(actorsTable.name, `%${kw}%`),
  ]);

  const rows = await db
    .select({
      id: videosTable.id,
      title: videosTable.title,
      dramaName: dramasTable.name,
      actorName: actorsTable.name,
    })
    .from(videosTable)
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(or(...conditions))
    .orderBy(desc(videosTable.popularityScore))
    .limit(8);

  return rows;''',
    "search: ikutan cari di nama aktor/idol, bukan cuma judul & drama",
)

replace_once(
    AI_ROUTE,
    '''${searchResults.map((r) => `- ${r.title}${r.dramaName ? ` (${r.dramaName})` : ""} -> /videos/${r.id}`).join("\\n")}`''',
    '''${searchResults.map((r) => `- ${r.title}${r.dramaName ? ` (${r.dramaName})` : ""}${r.actorName ? ` [${r.actorName}]` : ""} -> /videos/${r.id}`).join("\\n")}`''',
    "tampilin nama aktor/idol juga di hasil pencarian",
)

print("\nSelesai patch51: pencarian sekarang ikut nyari nama aktor/idol juga.")
