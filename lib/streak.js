import { supabaseAdmin } from './supabaseAdmin';

// Catat "hari ini user buka web" — aman dipanggil berkali-kali di hari yang sama
export async function recordLoginDay(userId) {
  if (!userId) return;
  try {
    const db = supabaseAdmin();
    const today = new Date().toISOString().slice(0, 10);
    await db.from('user_login_days').upsert(
      { user_id: userId, login_date: today },
      { onConflict: 'user_id,login_date', ignoreDuplicates: true }
    );
  } catch (e) {
    console.error('recordLoginDay error:', e);
  }
}

// Streak yang LAGI JALAN (bukan rekor terpanjang)
export function computeCurrentStreak(loginDates) {
  if (!loginDates || loginDates.length === 0) return 0;
  const daySet = new Set(loginDates);
  const toKey = (ms) => new Date(ms).toISOString().slice(0, 10);
  let cursor = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  if (!daySet.has(toKey(cursor))) cursor -= 86400000;
  let streak = 0;
  while (daySet.has(toKey(cursor))) {
    streak += 1;
    cursor -= 86400000;
  }
  return streak;
}