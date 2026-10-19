-- DramaVers database schema
-- Jalankan seluruh file ini di Supabase SQL Editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- ========== USERS ==========
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,               -- usn TikTok, lowercase, dipakai login
  password_hash text not null,
  display_name text not null default '',
  bio text default '',
  avatar_url text,
  role text not null default 'user',            -- 'user' | 'admin'
  credits int not null default 0,
  downloads_unlocked boolean not null default false, -- sudah masukin kode sekali
  username_changed_at timestamptz default now(),
  created_at timestamptz not null default now()
);

-- ========== CATEGORIES & SUBCATEGORIES ==========
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,        -- ASIA, WESTERN, JKT48, KPOP, ANIME, dst
  slug text unique not null,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,               -- kdrama, jdrama, cdrama, idrama, dst
  slug text not null,
  sort_order int default 0,
  unique (category_id, slug)
);

-- ========== ACTORS (solo, lintas kategori) ==========
create table if not exists actors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  bio text default '',
  created_at timestamptz not null default now()
);

-- ========== DRAMAS / SHOWS (item di dalam kategori) ==========
create table if not exists dramas (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  subcategory_id uuid references subcategories(id) on delete set null,
  title text not null,
  poster_url text,
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists drama_actors (
  drama_id uuid references dramas(id) on delete cascade,
  actor_id uuid references actors(id) on delete cascade,
  primary key (drama_id, actor_id)
);

-- ========== CLIPS ==========
create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  drama_id uuid references dramas(id) on delete cascade,
  title text default '',
  video_url text not null,
  duration_seconds int,
  created_at timestamptz not null default now()
);

create table if not exists clip_actors (
  clip_id uuid references clips(id) on delete cascade,
  actor_id uuid references actors(id) on delete cascade,
  primary key (clip_id, actor_id)
);

-- ========== FOLLOWS ==========
create table if not exists follows (
  follower_id uuid references users(id) on delete cascade,
  following_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- ========== MESSAGES (global chat: receiver_id null, private: diisi) ==========
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete cascade,
  receiver_id uuid references users(id) on delete cascade,  -- null = global chat
  content text default '',
  shared_drama_id uuid references dramas(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conv on messages (sender_id, receiver_id, created_at);
create index if not exists idx_messages_global on messages (receiver_id, created_at);

-- ========== APP SETTINGS (kode unlock download, bisa diubah admin) ==========
create table if not exists app_settings (
  key text primary key,
  value text
);

insert into app_settings (key, value)
values ('download_unlock_code', 'DRAMAVERS2026')
on conflict (key) do nothing;

-- ========== Seed kategori dasar ==========
insert into categories (name, slug, sort_order) values
  ('ASIA', 'asia', 1),
  ('WESTERN', 'western', 2),
  ('JKT48', 'jkt48', 3),
  ('KPOP', 'kpop', 4),
  ('ANIME', 'anime', 5)
on conflict (name) do nothing;

insert into subcategories (category_id, name, slug, sort_order)
select id, x.name, x.slug, x.sort_order from categories,
  (values ('KDrama','kdrama',1), ('JDrama','jdrama',2), ('CDrama','cdrama',3), ('IDrama','idrama',4)) as x(name, slug, sort_order)
where categories.slug = 'asia'
on conflict do nothing;
