import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame, ArrowLeft } from "lucide-react";

const API_BASE = "https://dramavers-production.up.railway.app";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  photoUrl: string | null;
  longestStreak: number;
  totalDays: number;
}

async function fetchLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  const res = await fetch(`${API_BASE}/api/leaderboard`);
  if (!res.ok) throw new Error("Gagal memuat leaderboard");
  return res.json();
}

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
  });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
        <Link href="/profile" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Profil</span>
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="h-7 w-7 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-sm text-white/40 mb-8">Ranking berdasarkan streak login terpanjang</p>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : data && data.leaderboard.length > 0 ? (
          <div className="space-y-2">
            {data.leaderboard.map((entry) => (
              <Link
                key={entry.userId}
                href={`/users/${entry.userId}`}
                className="flex items-center gap-3 p-3 rounded-xl glass-panel border-white/5 hover:border-primary/50 transition-colors"
              >
                <span className={`text-lg font-black w-7 text-center flex-shrink-0 ${RANK_COLORS[entry.rank] ?? "text-white/30"}`}>
                  {entry.rank}
                </span>
                <div className="w-10 h-10 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {entry.photoUrl
                    ? <img src={entry.photoUrl} className="w-full h-full object-cover" alt={entry.username} />
                    : entry.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">@{entry.username}</p>
                  <p className="text-xs text-white/40">{entry.totalDays} hari aktif</p>
                </div>
                <div className="flex items-center gap-1 text-primary flex-shrink-0">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-bold">{entry.longestStreak}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Belum ada data</p>
          </div>
        )}
      </main>
    </div>
  );
}
