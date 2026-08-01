import sys

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

PROFILE_PATH = "artifacts/twixtor-archive/src/pages/profile/index.tsx"

replace_once(
    PROFILE_PATH,
    """import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";""",
    """import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { StreakCard } from "@/components/ui/streak-card";

const API_BASE = "https://dramavers-production.up.railway.app";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  total: number;
  periods: { periodStart: string; periodEnd: string }[];
}

async function fetchStreak(): Promise<StreakData> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/auth/streak`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat streak");
  return res.json();
}""",
    "Import StreakCard + add fetchStreak helper to profile page",
)

replace_once(
    PROFILE_PATH,
    """  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">

        {/* User profile header */}""",
    """  const { data: streakData } = useQuery({
    queryKey: ["login-streak"],
    queryFn: fetchStreak,
    enabled: !!u,
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-5xl">

        {/* Login streak */}
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
        )}

        {/* User profile header */}""",
    "Fetch streak data and render StreakCard at top of profile page",
)

print("\nAll patches applied successfully.")
