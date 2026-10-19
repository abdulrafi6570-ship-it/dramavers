export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { comparePassword, signSession, setSessionCookie } from '../../../../lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username & password wajib diisi' }, { status: 400 });
  }
  const uname = username.trim().toLowerCase();
  const db = supabaseAdmin();

  const { data: user } = await db.from('users').select('*').eq('username', uname).maybeSingle();
  if (!user) return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 404 });

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Password salah' }, { status: 401 });

  const token = signSession(user);
  setSessionCookie(token);

  // Catat hari login buat streak & leaderboard (aman kalau dipanggil berkali-kali di hari yang sama)
  await db.from('user_login_days').upsert(
    { user_id: user.id, login_date: new Date().toISOString().slice(0, 10) },
    { onConflict: 'user_id,login_date', ignoreDuplicates: true }
  );

  return NextResponse.json({
    user: {
      username: user.username,
      role: user.role,
      downloads_unlocked: user.downloads_unlocked,
    },
  });
}
