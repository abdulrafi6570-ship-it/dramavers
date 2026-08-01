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

ROUTES_INDEX = "artifacts/api-server/src/routes/index.ts"
APP_TSX = "artifacts/twixtor-archive/src/App.tsx"
PROFILE_PATH = "artifacts/twixtor-archive/src/pages/profile/index.tsx"

add_file(
    "artifacts/api-server/src/routes/watch-history.ts",
    "watch-history-route.ts",
    "Add watch-history.ts backend route",
)

add_file(
    "artifacts/twixtor-archive/src/pages/watch-history/index.tsx",
    "watch-history-page.tsx",
    "Add watch-history frontend page",
)

replace_once(
    ROUTES_INDEX,
    'import favoritesRouter from "./favorites";',
    'import favoritesRouter from "./favorites";\nimport watchHistoryRouter from "./watch-history";',
    "Import watchHistoryRouter",
)

replace_once(
    ROUTES_INDEX,
    "router.use(favoritesRouter);",
    "router.use(favoritesRouter);\nrouter.use(watchHistoryRouter);",
    "Register watchHistoryRouter",
)

replace_once(
    APP_TSX,
    'import History from "@/pages/history/index";',
    'import History from "@/pages/history/index";\nimport WatchHistory from "@/pages/watch-history/index";',
    "Import WatchHistory page into App.tsx",
)

replace_once(
    APP_TSX,
    '<Route path="/history" component={History} />',
    '<Route path="/history" component={History} />\n      <Route path="/watch-history" component={WatchHistory} />',
    "Register /watch-history route",
)

replace_once(
    PROFILE_PATH,
    """          {[
            { href: "/favorites", label: "Favorites", desc: "Videos you liked" },
            { href: "/bookmarks", label: "Bookmarks", desc: "Saved for later" },
            { href: "/history", label: "History", desc: "Previously downloaded" },
          ].map((item) => (""",
    """          {[
            { href: "/favorites", label: "Favorites", desc: "Videos you liked" },
            { href: "/bookmarks", label: "Bookmarks", desc: "Saved for later" },
            { href: "/history", label: "History", desc: "Previously downloaded" },
            { href: "/watch-history", label: "Riwayat Tontonan", desc: "Video yang pernah kamu tonton" },
          ].map((item) => (""",
    "Add Riwayat Tontonan quick link on profile page",
)

print("\nAll patches applied successfully.")
