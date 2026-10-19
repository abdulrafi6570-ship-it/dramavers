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

PROFILE_PATH = "artifacts/twixtor-archive/src/pages/profile/index.tsx"

add_file(
    "artifacts/twixtor-archive/src/components/BadgeGrid.tsx",
    "badge-grid.tsx",
    "Add BadgeGrid component",
)

replace_once(
    PROFILE_PATH,
    """import { StreakCard } from "@/components/ui/streak-card";

const API_BASE = "https://dramavers-production.up.railway.app";""",
    """import { StreakCard } from "@/components/ui/streak-card";
import { BadgeGrid } from "@/components/BadgeGrid";

const API_BASE = "https://dramavers-production.up.railway.app";""",
    "Import BadgeGrid into profile page",
)

replace_once(
    PROFILE_PATH,
    """async function fetchStreak(): Promise<StreakData> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/auth/streak`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat streak");
  return res.json();
}""",
    """async function fetchStreak(): Promise<StreakData> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/auth/streak`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat streak");
  return res.json();
}

async function fetchBadges() {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/auth/badges`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat pencapaian");
  return res.json();
}""",
    "Add fetchBadges helper",
)

replace_once(
    PROFILE_PATH,
    """  const { data: streakData } = useQuery({
    queryKey: ["login-streak"],
    queryFn: fetchStreak,
    enabled: !!u,
  });""",
    """  const { data: streakData } = useQuery({
    queryKey: ["login-streak"],
    queryFn: fetchStreak,
    enabled: !!u,
  });

  const { data: badgesData } = useQuery({
    queryKey: ["badges"],
    queryFn: fetchBadges,
    enabled: !!u,
  });""",
    "Fetch badges alongside streak data",
)

replace_once(
    PROFILE_PATH,
    """        {/* Login streak */}
        {streakData && (
          <div className="mb-10">
            <StreakCard
              streak={streakData.periods}
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              total={streakData.total}
              title="Login Streak"
            />
          </div>
        )}""",
    """        {/* Login streak */}
        {streakData && (
          <div className="mb-6">
            <StreakCard
              streak={streakData.periods}
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              total={streakData.total}
              title="Login Streak"
            />
          </div>
        )}

        {/* Achievement badges */}
        {badgesData?.badges && (
          <div className="mb-10">
            <BadgeGrid badges={badgesData.badges} />
          </div>
        )}""",
    "Render BadgeGrid right after StreakCard",
)

print("\nAll patches applied successfully.")
