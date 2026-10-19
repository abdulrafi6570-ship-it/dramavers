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

APP_TSX = "artifacts/twixtor-archive/src/App.tsx"
ADMIN_INDEX = "artifacts/twixtor-archive/src/pages/admin/index.tsx"

add_file(
    "artifacts/twixtor-archive/src/pages/admin/analytics.tsx",
    "admin-analytics-page.tsx",
    "Add admin analytics page",
)

replace_once(
    APP_TSX,
    'import Collections from "@/pages/collections/index";',
    'import Collections from "@/pages/collections/index";\nimport AdminAnalytics from "@/pages/admin/analytics";',
    "Import AdminAnalytics page into App.tsx",
)

replace_once(
    APP_TSX,
    '<Route path="/collections" component={Collections} />',
    '<Route path="/collections" component={Collections} />\n      <Route path="/admin/analytics" component={AdminAnalytics} />',
    "Register /admin/analytics route",
)

replace_once(
    ADMIN_INDEX,
    'import { Users, Film, Star, Download, Play, Shield, Megaphone, Settings2, Key, MessageCircle } from "lucide-react";',
    'import { Users, Film, Star, Download, Play, Shield, Megaphone, Settings2, Key, MessageCircle, BarChart3 } from "lucide-react";',
    "Import BarChart3 icon into admin dashboard",
)

replace_once(
    ADMIN_INDEX,
    """  const mgmtItems = [
    { label: "Videos",       icon: <Film size={16} />,     action: () => setLocation("/admin/videos") },""",
    """  const mgmtItems = [
    { label: "Analytics",    icon: <BarChart3 size={16} />, action: () => setLocation("/admin/analytics") },
    { label: "Videos",       icon: <Film size={16} />,     action: () => setLocation("/admin/videos") },""",
    "Add Analytics menu item to admin dashboard",
)

print("\nAll patches applied successfully.")
