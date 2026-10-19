-- Fase 2: Collections, Watch History, Login Streak/Leaderboard
-- Jalankan di Supabase SQL Editor SETELAH schema.sql + phase1_engagement.sql
-- Aman dijalankan berkali-kali (pakai if not exists).

-- ========== COLLECTIONS (playlist pribadi user) ==========
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists collection_clips (
  collection_id uuid references collections(id) on delete cascade,
  clip_id uuid references clips(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, clip_id)
);

-- ========== WATCH HISTORY ==========
create table if not exists clip_views (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references clips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists clip_views_user_idx on clip_views(user_id, viewed_at desc);

-- ========== LOGIN STREAK / LEADERBOARD ==========
create table if not exists user_login_days (
  user_id uuid references users(id) on delete cascade,
  login_date date not null default current_date,
  primary key (user_id, login_date)
);

create index if not exists collections_user_idx on collections(user_id);
