export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Flame, Users, Film, MessageSquarePlus, Sparkles } from 'lucide-react';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import CategoryFolders from '../components/CategoryFolders';
import ActorStrip from '../components/ActorStrip';
import FilmWheel from '../components/ui/film-wheel';
import RunningAnnouncement from '../components/RunningAnnouncement';
import TopViewedSlider from '../components/TopViewedSlider';
import DramaGridFilter from '../components/DramaGridFilter';

export default async function HomePage() {
  const db = supabaseAdmin();
  const { data: categories } = await db
    .from('categories')
    .select('*')
    .order('sort_order');

  const categoriesWithProjects = await Promise.all(
    (categories || []).map(async (c) => {
      const { data: dramas } = await db
        .from('dramas')
        .select('id, title, poster_url')
        .eq('category_id', c.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return {
        ...c,
        projects: (dramas || []).map((d) => ({
          id: d.id,
          image: d.poster_url,
          title: d.title,
        })),
      };
    })
  );

  const { data: actors } = await db
    .from('actors')
    .select('id, name, photo_url, bio')
    .order('name')
    .limit(12);

  const { data: wheelRaw } = await db
    .from('dramas')
    .select('id, title, poster_url, categories(name)')
    .not('poster_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(8);

  const wheelFilms = (wheelRaw || []).map((d) => ({
    id: d.id,
    title: d.title,
    poster: d.poster_url,
    category: d.categories?.name || '',
  }));

  // Mengambil data klip & menghitung tayangan untuk Slider & Filter
  const { data: rawClips } = await db
    .from('clips')
    .select('*, dramas(id, title, poster_url)')
    .limit(100);

  const { data: viewLogs } = await db
    .from('clip_views')
    .select('clip_id');

  const viewMap = {};
  (viewLogs || []).forEach((v) => {
    if (v.clip_id) viewMap[v.clip_id] = (viewMap[v.clip_id] || 0) + 1;
  });

  // Hitung total klip & total tayangan per drama_id untuk Filter Terpopuler & Klip Terbanyak
  const dramaStats = {};
  (rawClips || []).forEach((c) => {
    const dId = c.drama_id;
    if (!dId) return;
    if (!dramaStats[dId]) {
      dramaStats[dId] = { clipsCount: 0, viewsCount: 0 };
    }
    const clipViews =
      c.views_count ?? c.view_count ?? c.views ?? viewMap[c.id] ?? 0;
    dramaStats[dId].clipsCount += 1;
    dramaStats[dId].viewsCount += clipViews;
  });

  const topViewedClips = (rawClips || [])
    .map((c) => {
      const views =
        c.views_count ?? c.view_count ?? c.views ?? viewMap[c.id] ?? 0;
      return {
        id: c.id,
        title: c.title || 'Klip Pilihan',
        description: c.description || '',
        dramaTitle: c.dramas?.title || '',
        image: c.thumbnail_url || c.dramas?.poster_url || '',
        video_url: c.video_url || '',
        views,
        href: c.drama_id ? `/drama/${c.drama_id}` : '/fyp',
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const { data: latestDramas } = await db
    .from('dramas')
    .select('id, title, poster_url, created_at, categories(name, slug)')
    .order('created_at', { ascending: false })
    .limit(24);

  const formattedDramas = (latestDramas || []).map((d) => ({
    id: d.id,
    title: d.title,
    poster_url: d.poster_url,
    created_at: d.created_at,
    category_name: d.categories?.name || '',
    clips_count: dramaStats[d.id]?.clipsCount || 0,
    views_count: dramaStats[d.id]?.viewsCount || 0,
  }));

  return (
    <div className="space-y-8 sm:space-y-10 px-1 sm:px-0 pb-28 sm:pb-12 animate-fade-in">
      {/* Banner Pengumuman Berjalan */}
      <RunningAnnouncement />

      {/* Baris Tombol Cepat ke Mode FYP & Request Klip */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <Link
          href="/requests"
          className="inline-flex items-center gap-2 rounded-2xl border-[3px] border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-extrabold text-foreground shadow-neo-sm transition-all hover:-translate-y-0.5 hover:bg-muted active:translate-y-0"
        >
          <MessageSquarePlus size={16} className="text-primary" />
          <span>Request Klip</span>
        </Link>

        <Link
          href="/fyp"
          className="inline-flex items-center gap-2 rounded-2xl border-[3px] border-border bg-secondary px-4 py-2 text-xs sm:text-sm font-extrabold text-secondary-foreground shadow-neo-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Film size={16} className="text-primary" />
          <span>Mode FYP Klip</span>
        </Link>
      </div>

      {/* BANNER SLIDE OTOMATIS (Penonton Paling Banyak) */}
      {topViewedClips.length > 0 && (
        <section>
          <TopViewedSlider items={topViewedClips} />
        </section>
      )}

      {/* 1. Bagian Kategori */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Flame size={18} className="text-primary" />
          <h1 className="text-lg font-bold">Kategori</h1>
        </div>
        <CategoryFolders categories={categoriesWithProjects} />
      </section>

      {/* 2. Banner Ringkas "Bingung Mau Nonton Apa" */}
      {wheelFilms.length > 0 && (
        <section>
          <FilmWheel films={wheelFilms} />
        </section>
      )}

      {/* 3. Bagian Aktor */}
      {actors?.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary" />
            <h2 className="text-lg font-bold">Aktor</h2>
          </div>
          <ActorStrip actors={actors} />
        </section>
      )}

      {/* 4. Bagian Koleksi Klip dengan Filter Cepat (Terbaru, Terpopuler, Klip Terbanyak, A-Z) */}
      <section>
        <DramaGridFilter dramas={formattedDramas} />
      </section>

      {/* 5. Widget Request Potongan Klip (Fitur No. 3) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border-[3px] border-border bg-gradient-to-r from-secondary via-card to-highlight/30 p-5 shadow-neo-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="text-base font-extrabold">
                Belum Nemu Potongan Klip yang Kamu Cari?
              </h3>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Kamu bisa request potongan klip member, aktor, atau adegan favoritmu di sini, atau bantu vote request dari pengguna lain supaya cepat diupload Admin!
            </p>
          </div>

          <Link
            href="/requests"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-[3px] border-border bg-primary px-4 py-2.5 text-xs sm:text-sm font-extrabold text-primary-foreground shadow-neo-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageSquarePlus size={16} />
            <span>Request & Vote Klip</span>
          </Link>
        </div>
      </section>
    </div>
  );
}