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
    "artifacts/api-server/src/routes/leaderboard.ts",
    "leaderboard-route.ts",
    "Add leaderboard.ts backend route",
)

add_file(
    "artifacts/twixtor-archive/src/pages/leaderboard/index.tsx",
    "leaderboard-page.tsx",
    "Add leaderboard frontend page",
)

replace_once(
    ROUTES_INDEX,
    'import collectionsRouter from "./collections";',
    'import collectionsRouter from "./collections";\nimport leaderboardRouter from "./leaderboard";',
    "Import leaderboardRouter",
)

replace_once(
    ROUTES_INDEX,
    "router.use(collectionsRouter);",
    "router.use(collectionsRouter);\nrouter.use(leaderboardRouter);",
    "Register leaderboardRouter",
)

replace_once(
    APP_TSX,
    'import AdminAnalytics from "@/pages/admin/analytics";',
    'import AdminAnalytics from "@/pages/admin/analytics";\nimport Leaderboard from "@/pages/leaderboard/index";',
    "Import Leaderboard page into App.tsx",
)

replace_once(
    APP_TSX,
    '<Route path="/admin/analytics" component={AdminAnalytics} />',
    '<Route path="/admin/analytics" component={AdminAnalytics} />\n      <Route path="/leaderboard" component={Leaderboard} />',
    "Register /leaderboard route",
)

replace_once(
    PROFILE_PATH,
    """            { href: "/collections", label: "Koleksi", desc: "Folder video buatanmu sendiri" },
          ].map((item) => (""",
    """            { href: "/collections", label: "Koleksi", desc: "Folder video buatanmu sendiri" },
            { href: "/leaderboard", label: "Leaderboard", desc: "Siapa paling rajin login" },
          ].map((item) => (""",
    "Add Leaderboard quick link on profile page",
)

print("\nAll patches applied successfully.")
