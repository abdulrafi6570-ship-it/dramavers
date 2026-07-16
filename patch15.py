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

replace_once(
    "artifacts/api-server/src/routes/auth.ts",
    "    bio: dbUser.bio ?? null,\n    createdAt: dbUser.createdAt.toISOString(),\n    followerCount: Number(followerCount),\n    followingCount: Number(followingCount),",
    "    bio: dbUser.bio ?? null,\n    isPrivate: dbUser.isPrivate ?? false,\n    createdAt: dbUser.createdAt.toISOString(),\n    followerCount: Number(followerCount),\n    followingCount: Number(followingCount),",
    "tambah isPrivate ke return getUserWithCounts",
)

print("SELESAI!")
