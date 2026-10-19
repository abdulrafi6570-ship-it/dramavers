export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSession, signSession, setSessionCookie } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { uploadToR2, isOwnR2Url } from '../../../../lib/r2';
import { computeCurrentStreak } from '../../../../lib/streak';

export async function GET(req, { params }) {
  const db = supabaseAdmin();
  const uname = params.username.toLowerCase();
  const session = getSession();

  const { data: user } = await db
    .from('users')
    .select('id, username, display_name, bio, avatar_url, role, created_at')
    .eq('username', uname)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });

  const { count: followers } = await db.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
  const { count: following } = await db.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);

  let isFollowing = false;
  if (session && session.id !== user.id) {
    const { data: f } = await db.from('follows').select('*').eq('follower_id', session.id).eq('following_id', user.id).maybeSingle();
    isFollowing = !!f;
  }

  const [{ count: views }, { count: likes }, { count: collections }, { count: comments }, { count: requests }, { data: loginDays }] =
    await Promise.all([
      db.from('clip_views').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('clip_likes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('clip_comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('content_requests').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      db.from('user_login_days').select('login_date').eq('user_id', user.id).order('login_date'),
    ]);

  let streak = 0;
  let runStart = null;
  let prevDate = null;
  for (const row of loginDays || []) {
    const d = new Date(`${row.login_date}T00:00:00Z`);
    if (!(prevDate && d.getTime() - prevDate.getTime() === 86400000)) runStart = d;
    const runLen = runStart ? (d.getTime() - runStart.getTime()) / 86400000 + 1 : 1;
    if (runLen > streak) streak = runLen;
    prevDate = d;
  }

  const currentStreak = computeCurrentStreak((loginDays || []).map((r) => r.login_date));

  return NextResponse.json({
    user,
    followers: followers || 0,
    following: following || 0,
    isSelf: session?.id === user.id,
    isFollowing,
    stats: {
      views: views || 0,
      likes: likes || 0,
      collections: collections || 0,
      comments: comments || 0,
      requests: requests || 0,
      streak,
      currentStreak,
    },
  });
}

export async function PATCH(req, { params }) {
  const session = getSession();
  if (!session || session.username !== params.username.toLowerCase()) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  const db = supabaseAdmin();
  const form = await req.formData();
  const display_name = form.get('display_name');
  const bio = form.get('bio');
  const new_username = form.get('username');
  const avatar = form.get('avatar');

  const update = {};
  if (display_name !== null) update.display_name = display_name.trim();
  if (bio !== null) update.bio = bio.trim();

  const avatarUrl = String(form.get('avatar_url') || '');
  if (avatarUrl) {
    if (!isOwnR2Url(avatarUrl, ['avatars'])) {
      return NextResponse.json({ error: 'Alamat foto tidak valid' }, { status: 400 });
    }
    update.avatar_url = avatarUrl;
  } else if (avatar && avatar.size > 0) {
    update.avatar_url = await uploadToR2(avatar, 'avatars');
  }

  if (new_username && new_username.toLowerCase() !== params.username.toLowerCase()) {
    const { data: me } = await db.from('users').select('username_changed_at').eq('id', session.id).single();
    const last = new Date(me.username_changed_at || 0);
    const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 3) {
      return NextResponse.json({ error: `Username baru bisa diganti lagi dalam ${Math.ceil(3 - diffDays)} hari` }, { status: 400 });
    }
    const uname = new_username.toLowerCase().trim();
    const { data: exists } = await db.from('users').select('id').eq('username', uname).maybeSingle();
    if (exists) return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 409 });
    update.username = uname;
    update.username_changed_at = new Date().toISOString();
  }

  const { data: updated, error } = await db.from('users').update(update).eq('id', session.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (update.username) {
    setSessionCookie(signSession(updated));
  }

  return NextResponse.json({ user: updated });
}