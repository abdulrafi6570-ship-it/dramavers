export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { BarChart3, Users, Film, Clapperboard, Eye, Download, Heart } from 'lucide-react';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { getSession } from '../../../lib/auth';
import PageHeader from '../../../components/admin/PageHeader';

async function count(db, table) {
  const { count } = await db.from(table).select('*', { count: 'exact', head: true });
  return count || 0;
}

export default async function AdminAnalyticsPage() {
  const session = getSession();
  if (!session || session.role !== 'admin') redirect('/login');

  const db = supabaseAdmin();
  const [users, dramas, clips, views, downloads, likes, comments] = await Promise.all([
    count(db, 'users'),
    count(db, 'dramas'),
    count(db, 'clips'),
    count(db, 'clip_views'),
    count(db, 'clip_downloads'),
    count(db, 'clip_likes'),
    count(db, 'clip_comments'),
  ]);

  // Drama paling banyak ditonton (agregasi dari view klip)
  const { data: viewRows } = await db.from('clip_views').select('clip_id');
  const { data: clipRows } = await db.from('clips').select('id, drama_id');
  const clipToDrama = new Map((clipRows || []).map((c) => [c.id, c.drama_id]));
  const dramaViewCount = new Map();
  for (const v of viewRows || []) {
    const dramaId = clipToDrama.get(v.clip_id);
    if (!dramaId) continue;
    dramaViewCount.set(dramaId, (dramaViewCount.get(dramaId) || 0) + 1);
  }
  const topDramaIds = [...dramaViewCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  let topDramas = [];
  if (topDramaIds.length > 0) {
    const { data: dramaInfo } = await db.from('dramas').select('id, title').in('id', topDramaIds.map((d) => d[0]));
    const infoMap = new Map((dramaInfo || []).map((d) => [d.id, d.title]));
    topDramas = topDramaIds.map(([id, c]) => ({ title: infoMap.get(id) || '(dihapus)', views: c }));
  }
  const maxViews = topDramas[0]?.views || 1;

  const stats = [
    { label: 'Total User', value: users, icon: Users, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Total Drama', value: dramas, icon: Film, tone: 'bg-pink-50 text-pink-600' },
    { label: 'Total Klip', value: clips, icon: Clapperboard, tone: 'bg-lime-50 text-lime-700' },
    { label: 'Total Tontonan', value: views, icon: Eye, tone: 'bg-[#fff4dc] text-[#b45309]' },
    { label: 'Total Download', value: downloads, icon: Download, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Like', value: likes, icon: Heart, tone: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Analitik"
        subtitle={`${comments.toLocaleString('id-ID')} komentar masuk`}
      />

      {/* Angka ringkas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="a-panel p-4">
              <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <p className="text-2xl font-black tracking-tight sm:text-3xl">
                {s.value.toLocaleString('id-ID')}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#777770]">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Drama terpopuler */}
      <section className="a-panel p-4 sm:p-5 lg:max-w-3xl">
        <h2 className="mb-4 text-base font-black">Drama Paling Banyak Ditonton</h2>

        <div className="space-y-4">
          {topDramas.map((d, i) => (
            <div key={i}>
              <div className="mb-1.5 flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff4dc] text-xs font-black text-[#b45309]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{d.title}</span>
                <span className="a-pill a-pill-read shrink-0">
                  {d.views.toLocaleString('id-ID')} views
                </span>
              </div>

              <div className="ml-10 h-1.5 overflow-hidden rounded-full bg-[#f0f0ec]">
                <div
                  className="h-full rounded-full bg-[#f59e0b]"
                  style={{ width: `${Math.max(4, Math.round((d.views / maxViews) * 100))}%` }}
                />
              </div>
            </div>
          ))}

          {topDramas.length === 0 && (
            <p className="text-sm text-[#999991]">Belum ada data tontonan.</p>
          )}
        </div>
      </section>
    </div>
  );
}