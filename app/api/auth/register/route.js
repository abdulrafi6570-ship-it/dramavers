export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { hashPassword, signSession, setSessionCookie } from '../../../../lib/auth';

export async function POST(req) {
  const { username, password, display_name, bio } = await req.json();

  if (!username || !password || password.length < 6) {
    return NextResponse.json({ error: 'Username & password (min 6 karakter) wajib diisi' }, { status: 400 });
  }
  const uname = username.trim().toLowerCase();
  const db = supabaseAdmin();

  const { data: exists } = await db.from('users').select('id').eq('username', uname).maybeSingle();
  if (exists) {
    return NextResponse.json({ error: 'Username TikTok ini sudah dipakai' }, { status: 409 });
  }

  const password_hash = await hashPassword(password);
  const { data: user, error } = await db
    .from('users')
    .insert({
      username: uname,
      password_hash,
      display_name: display_name?.trim() || uname,
      bio: bio?.trim() || '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const token = signSession(user);
  setSessionCookie(token);
  return NextResponse.json({ user: { username: user.username, role: user.role } });
}
