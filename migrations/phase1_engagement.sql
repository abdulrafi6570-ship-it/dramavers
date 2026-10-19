-- Fase 1: fitur engagement ala TWIXTOR Archive (like, bookmark, komentar, hitung download)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql utama.
-- Aman dijalankan berkali-kali (pakai if not exists).

create table if not exists clip_likes (
  clip_id uuid references clips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id)
);

create table if not exists clip_bookmarks (
  clip_id uuid references clips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id)
);

create table if not exists clip_comments (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references clips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists clip_downloads (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references clips(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists clip_comments_clip_idx on clip_comments(clip_id);
create index if not exists clip_downloads_clip_idx on clip_downloads(clip_id);
