-- Fase 4: Request konten (dengan voting) & Feedback user
-- Jalankan di Supabase SQL Editor SETELAH schema.sql + phase1 + phase2 + phase3.

create table if not exists content_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  drama text not null,
  actor text,
  scene text,
  episode text,
  created_at timestamptz not null default now()
);

create table if not exists request_votes (
  request_id uuid references content_requests(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (request_id, user_id)
);

create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  username text,
  message text not null,
  image_url text,
  status text not null default 'new', -- new | read | done
  created_at timestamptz not null default now()
);

create index if not exists request_votes_request_idx on request_votes(request_id);
