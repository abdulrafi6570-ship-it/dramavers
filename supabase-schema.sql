-- =============================================================
-- TWIXTOR ARCHIVE — Supabase Schema Migration
-- Paste ini di Supabase Dashboard → SQL Editor → Run
-- =============================================================

-- 1. USERS (profiles, linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          bigserial PRIMARY KEY,
  supabase_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text NOT NULL UNIQUE,
  password_hash text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  verified    boolean NOT NULL DEFAULT false,
  photo_url   text,
  bio         text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. DRAMAS
CREATE TABLE IF NOT EXISTS public.dramas (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  poster_url  text,
  description text,
  category    text NOT NULL DEFAULT 'kdrama'
                   CHECK (category IN ('kdrama','cdrama','indo','film_barat','anime','series')),
  genre       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. ACTORS
CREATE TABLE IF NOT EXISTS public.actors (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  photo_url   text,
  type        text NOT NULL DEFAULT 'drama' CHECK (type IN ('drama','solo')),
  bio         text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. DRAMA_ACTORS (junction)
CREATE TABLE IF NOT EXISTS public.drama_actors (
  drama_id bigint NOT NULL REFERENCES public.dramas(id) ON DELETE CASCADE,
  actor_id bigint NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  PRIMARY KEY (drama_id, actor_id)
);

-- 5. VIDEOS
CREATE TABLE IF NOT EXISTS public.videos (
  id               bigserial PRIMARY KEY,
  title            text NOT NULL,
  drama_id         bigint REFERENCES public.dramas(id) ON DELETE SET NULL,
  actor_id         bigint REFERENCES public.actors(id) ON DELETE SET NULL,
  episode          text,
  scene            text,
  video_url        text,
  thumbnail_url    text,
  type             text NOT NULL DEFAULT 'slomo' CHECK (type IN ('slomo','non_slomo')),
  status           text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','published','hidden','processing','broken')),
  resolution       text,
  fps              integer,
  duration         integer,
  file_size        integer,
  format           text,
  tags             text[] NOT NULL DEFAULT '{}',
  view_count       integer NOT NULL DEFAULT 0,
  download_count   integer NOT NULL DEFAULT 0,
  favorite_count   integer NOT NULL DEFAULT 0,
  popularity_score real DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 6. FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id   bigint NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

-- 7. BOOKMARKS
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id   bigint NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

-- 8. DOWNLOADS
CREATE TABLE IF NOT EXISTS public.downloads (
  id         bigserial PRIMARY KEY,
  user_id    bigint REFERENCES public.users(id) ON DELETE CASCADE,
  video_id   bigint REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. RATINGS
CREATE TABLE IF NOT EXISTS public.ratings (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id   bigint NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  rating     integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

-- 10. FOLLOWS (user follows actor)
CREATE TABLE IF NOT EXISTS public.follows (
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id   bigint NOT NULL REFERENCES public.actors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, actor_id)
);

-- 11. USER_FOLLOWS (user follows user)
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id  bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- 12. ACCESS_CODES
CREATE TABLE IF NOT EXISTS public.access_codes (
  id         bigserial PRIMARY KEY,
  code       text NOT NULL UNIQUE,
  active     boolean NOT NULL DEFAULT true,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. ADS
CREATE TABLE IF NOT EXISTS public.ads (
  id               bigserial PRIMARY KEY,
  type             text NOT NULL DEFAULT 'image',
  media_url        text NOT NULL,
  title            text,
  description      text,
  duration_seconds integer NOT NULL DEFAULT 5,
  link_url         text,
  active           boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 14. SITE_SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 15. USER_FEEDBACK
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id         bigserial PRIMARY KEY,
  user_id    bigint REFERENCES public.users(id) ON DELETE SET NULL,
  username   text,
  message    text NOT NULL DEFAULT '',
  image_url  text,
  mime_type  text,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 16. CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id         bigserial PRIMARY KEY,
  user_id    bigint REFERENCES public.users(id) ON DELETE CASCADE,
  username   text,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 17. COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  video_id   bigint NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  parent_id  bigint REFERENCES public.comments(id) ON DELETE CASCADE,
  text       text NOT NULL,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 18. COMMENT_LIKES
CREATE TABLE IF NOT EXISTS public.comment_likes (
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment_id bigint NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, comment_id)
);

-- 19. CONTENT_REQUESTS
CREATE TABLE IF NOT EXISTS public.content_requests (
  id         bigserial PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  drama      text NOT NULL,
  actor      text,
  scene      text,
  episode    text,
  votes      integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 20. REQUEST_VOTES
CREATE TABLE IF NOT EXISTS public.request_votes (
  user_id    bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_id bigint NOT NULL REFERENCES public.content_requests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, request_id)
);

-- 21. UPLOADS
CREATE TABLE IF NOT EXISTS public.uploads (
  id            bigserial PRIMARY KEY,
  user_id       bigint REFERENCES public.users(id) ON DELETE SET NULL,
  filename      text NOT NULL,
  original_name text NOT NULL,
  mime_type     text NOT NULL,
  file_size     bigint NOT NULL,
  r2_key        text NOT NULL UNIQUE,
  public_url    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- SQL HELPER FUNCTIONS (atomic counters)
-- =============================================================

CREATE OR REPLACE FUNCTION public.increment_video_view(vid_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos
  SET view_count = view_count + 1,
      popularity_score = COALESCE(popularity_score, 0) + 0.5
  WHERE id = vid_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_video_download(vid_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos
  SET download_count = download_count + 1,
      popularity_score = COALESCE(popularity_score, 0) + 2
  WHERE id = vid_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_video_favorite(vid_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos
  SET favorite_count = favorite_count + 1,
      popularity_score = COALESCE(popularity_score, 0) + 1
  WHERE id = vid_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_video_favorite(vid_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.videos
  SET favorite_count = GREATEST(favorite_count - 1, 0)
  WHERE id = vid_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_request_votes(req_id bigint)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_votes integer;
BEGIN
  SELECT COUNT(*) INTO new_votes FROM public.request_votes WHERE request_id = req_id;
  UPDATE public.content_requests SET votes = new_votes WHERE id = req_id;
  RETURN new_votes;
END;
$$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drama_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Public read access for content tables
CREATE POLICY "Public read dramas" ON public.dramas FOR SELECT USING (true);
CREATE POLICY "Public read actors" ON public.actors FOR SELECT USING (true);
CREATE POLICY "Public read drama_actors" ON public.drama_actors FOR SELECT USING (true);
CREATE POLICY "Public read published videos" ON public.videos FOR SELECT USING (status = 'published');
CREATE POLICY "Public read ads" ON public.ads FOR SELECT USING (active = true);
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Public read requests" ON public.content_requests FOR SELECT USING (true);
CREATE POLICY "Public read chat" ON public.chat_messages FOR SELECT USING (true);

-- Authenticated user access (own data)
CREATE POLICY "Users own favorites" ON public.favorites FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users own bookmarks" ON public.bookmarks FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users own downloads" ON public.downloads FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users own ratings" ON public.ratings FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users own follows" ON public.follows FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users own user_follows" ON public.user_follows FOR ALL USING (follower_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users own comments" ON public.comments FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users own requests" ON public.content_requests FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (supabase_id = auth.uid());

-- NOTE: API server uses SERVICE_ROLE key which bypasses RLS completely.
-- RLS above applies only to direct client-side Supabase access.
