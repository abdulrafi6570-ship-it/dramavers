export const dynamic = 'force-dynamic';
import { Trophy, Flame } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import Avatar from '../../components/ui/avatar';
import { Card } from '../../components/ui/card';

function computeStreaks(rows) {
  const byUser = new Map();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id).push(r.login_date);
  }

  const entries = [];
  for (const [userId, dates] of byUser) {
    let longestStreak = 0;
    let runStart = null;
    let prevDate = null;
    for (const dStr of dates) {
      const d = new Date(`${dStr}T00:00:00Z`);
      if (!(prevDate && d.getTime() - prevDate.getTime() === 86400000)) {
        runStart = d;
      }
      const runLen = runStart ? (d.getTime() - runStart.getTime()) / 86400000 + 1 : 1;
      if (runLen > longestStreak) longestStreak = runLen;
      prevDate = d;
    }
    entries.push({ userId, longestStreak, totalDays: dates.length });
  }

  entries.sort((a, b) => b.longestStreak - a.longestStreak || b.totalDays - a.totalDays);
  return entries.slice(0, 20);
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage() {
  const db = supabaseAdmin();
  const { data: rows } = await db
    .from('user_login_days')
    .select('user_id, login_date')
    .order('login_date');

  const top = computeStreaks(rows || []);
  const userIds = top.map((e) => e.userId);

  let userMap = new Map();
  if (userIds.length > 0) {
    const { data: users } = await db.from('users').select('id, username, avatar_url').in('id', userIds);
    userMap = new Map((users || []).map((u) => [u.id, u]));
  }

  const leaderboard = top.filter((e) => userMap.has(e.userId));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-primary" />
        <h1 className="text-xl font-bold">Leaderboard Streak Login</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">Login tiap hari biar streak-mu naik dan masuk peringkat.</p>

      <Card className="divide-y divide-border overflow-hidden">
        {leaderboard.map((e, i) => {
          const u = userMap.get(e.userId);
          return (
            <div key={e.userId} className="flex items-center gap-3 p-3.5">
              <span className="w-6 text-center text-sm font-bold text-muted-foreground shrink-0">
                {MEDAL[i] || i + 1}
              </span>
              <Avatar size={36} src={u.avatar_url} alt={u.username} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">@{u.username}</p>
                <p className="text-xs text-muted-foreground">{e.totalDays} hari login</p>
              </div>
              <div className="flex items-center gap-1 text-primary font-bold text-sm shrink-0">
                <Flame size={15} /> {e.longestStreak}
              </div>
            </div>
          );
        })}
        {leaderboard.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">Belum ada data streak. Login besok lagi buat mulai streak-mu!</p>
        )}
      </Card>
    </div>
  );
}
