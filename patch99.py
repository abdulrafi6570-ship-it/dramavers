import sys, os, shutil

def replace_once(path, old, new, label):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        print(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
        sys.exit(1)
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

def add_file(dest, source, label):
    if os.path.exists(dest):
        print(f"[FAIL] {label}: {dest} already exists — refusing to overwrite")
        sys.exit(1)
    if not os.path.exists(source):
        print(f"[FAIL] {label}: source file {source} not found next to this script")
        sys.exit(1)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy(source, dest)
    print(f"[OK] {label}")

SCHEMA_INDEX = "lib/db/src/schema/index.ts"
ROUTES_INDEX = "artifacts/api-server/src/routes/index.ts"

add_file(
    "lib/db/src/schema/collections.ts",
    "collections-schema.ts",
    "Add collections.ts schema file",
)

add_file(
    "lib/db/src/schema/collection_videos.ts",
    "collection-videos-schema.ts",
    "Add collection_videos.ts schema file",
)

add_file(
    "artifacts/api-server/src/routes/collections.ts",
    "collections-route.ts",
    "Add collections.ts backend route",
)

replace_once(
    SCHEMA_INDEX,
    'export * from "./user_login_days";',
    'export * from "./user_login_days";\nexport * from "./collections";\nexport * from "./collection_videos";',
    "Register collections + collection_videos schema exports",
)

replace_once(
    ROUTES_INDEX,
    'import watchHistoryRouter from "./watch-history";',
    'import watchHistoryRouter from "./watch-history";\nimport collectionsRouter from "./collections";',
    "Import collectionsRouter",
)

replace_once(
    ROUTES_INDEX,
    "router.use(watchHistoryRouter);",
    "router.use(watchHistoryRouter);\nrouter.use(collectionsRouter);",
    "Register collectionsRouter",
)

print("\nAll patches applied successfully.")
