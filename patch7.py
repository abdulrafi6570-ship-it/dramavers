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

OPENAPI = "lib/api-spec/openapi.yaml"
replace_once(
    OPENAPI,
    """    SearchResults:
      type: object
      properties:
        dramas:
          type: array
          items:
            $ref: "#/components/schemas/Drama"
        actors:
          type: array
          items:
            $ref: "#/components/schemas/Actor"
        videos:
          type: array
          items:
            $ref: "#/components/schemas/Video"

    AdminStats:""",
    """    SearchUser:
      type: object
      required: [id, username]
      properties:
        id: { type: integer }
        username: { type: string }
        photoUrl:
          type: string
          nullable: true
        verified: { type: boolean }

    SearchResults:
      type: object
      properties:
        dramas:
          type: array
          items:
            $ref: "#/components/schemas/Drama"
        actors:
          type: array
          items:
            $ref: "#/components/schemas/Actor"
        videos:
          type: array
          items:
            $ref: "#/components/schemas/Video"
        users:
          type: array
          items:
            $ref: "#/components/schemas/SearchUser"

    AdminStats:""",
    "tambah SearchUser + users ke SearchResults di openapi.yaml",
)

SCHEMAS = "lib/api-client-react/src/generated/api.schemas.ts"
replace_once(
    SCHEMAS,
    """export interface SearchResults {
  dramas?: Drama[];
  actors?: Actor[];
  videos?: Video[];
}""",
    """export interface SearchUser {
  id: number;
  username: string;
  /** @nullable */
  photoUrl?: string | null;
  verified?: boolean;
}

export interface SearchResults {
  dramas?: Drama[];
  actors?: Actor[];
  videos?: Video[];
  users?: SearchUser[];
}""",
    "tambah SearchUser + users ke SearchResults di api.schemas.ts",
)

SEARCH_PAGE = "artifacts/twixtor-archive/src/pages/search/index.tsx"
replace_once(
    SEARCH_PAGE,
    """            {(data as any).users && (data as any).users.length > 0 && (
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
              (!(data as any).users || (data as any).users.length === 0) && (""",
    """            {data.users && data.users.length > 0 && (
              <section>
                <h2 className="font-heading text-base mb-4 text-white/60 uppercase tracking-widest">Akun</h2>
                <div className="space-y-2">
                  {data.users.map((u) => (
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
              (!data.users || data.users.length === 0) && (""",
    "ganti (data as any).users jadi data.users proper typed",
)

print("\nSelesai patch username search!")
