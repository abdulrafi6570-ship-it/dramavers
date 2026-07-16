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

HOME = "artifacts/api-server/src/routes/home.ts"
SEARCH = "artifacts/twixtor-archive/src/pages/search/index.tsx"

replace_once(
    HOME,
    'import { db, videosTable, dramasTable, actorsTable } from "@workspace/db";',
    'import { db, videosTable, dramasTable, actorsTable, usersTable } from "@workspace/db";',
    "import usersTable di home.ts",
)

replace_once(
    HOME,
    '''  const [dramas, actors] = await Promise.all([
    db.select().from(dramasTable).where(ilike(dramasTable.name, `%${q}%`)).limit(8),
    db.select().from(actorsTable).where(ilike(actorsTable.name, `%${q}%`)).limit(8),
  ]);

  res.json({
    dramas: dramas.map(formatDrama),
    actors: actors.map((a) => ({
      id: a.id, name: a.name, photoUrl: a.photoUrl ?? null,
      type: a.type ?? "drama", bio: a.bio ?? null, videoCount: 0,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
    videos: [],
  });''',
    '''  const [dramas, actors, users] = await Promise.all([
    db.select().from(dramasTable).where(ilike(dramasTable.name, `%${q}%`)).limit(8),
    db.select().from(actorsTable).where(ilike(actorsTable.name, `%${q}%`)).limit(8),
    db.select().from(usersTable).where(ilike(usersTable.username, `%${q}%`)).limit(8),
  ]);

  res.json({
    dramas: dramas.map(formatDrama),
    actors: actors.map((a) => ({
      id: a.id, name: a.name, photoUrl: a.photoUrl ?? null,
      type: a.type ?? "drama", bio: a.bio ?? null, videoCount: 0,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    })),
    users: users.map((u) => ({
      id: u.id, username: u.username, photoUrl: u.photoUrl ?? null, verified: u.verified,
    })),
    videos: [],
  });''',
    "tambah pencarian username di endpoint /search",
)

replace_once(
    SEARCH,
    '''            {(!data.dramas || data.dramas.length === 0) &&
              (!data.actors || data.actors.length === 0) && (''',
    '''            {(data as any).users && (data as any).users.length > 0 && (
              <section>
                <h2 className="font-heading text-base mb-4 text-white/60 uppercase tracking-widest">Akun</h2>
                <div className="space-y-2">
                  {(data as any).users.map((u: any) => (
                    <Link
                      key={u.id}
                      href={`/users/${u.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg glass-panel border-white/5 hover:border-primary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {u.photoUrl
                          ? <img src={u.photoUrl} className="w-full h-full object-cover" alt={u.username} />
                          : u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white/90">@{u.username}</span>
                      {u.verified && <span className="text-xs text-white/50">✓</span>}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(!data.dramas || data.dramas.length === 0) &&
              (!data.actors || data.actors.length === 0) &&
              (!(data as any).users || (data as any).users.length === 0) && (''',
    "tampilkan hasil pencarian akun (username) + fix kondisi 'tidak ada hasil'",
)

print("\nSelesai patch fitur cari akun/username buat follow.")
