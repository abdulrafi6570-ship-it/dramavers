export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { History } from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { getSession } from '../../lib/auth';
import ClipCard from '../../components/ClipCard';

export default async function WatchHistoryPage() {
  const session = getSession();
  if (!session) redirect('/login');

  const db = supabaseAdmin();
  const { data: rows } = await db
    .from('clip_views')
    .select('viewed_at, clips(id, title, video_url, drama_id, dramas(id, title))')
    .eq('user_id', session.id)
    .order('viewed_at', { ascending: false })
    .limit(50);

  // dedupe klip yang sama, ambil tontonan terakhir aja
  const seen = new Set();
  const clips = [];
  for (const r of rows || []) {
    if (!r.clips || seen.has(r.clips.id)) continue;
    seen.add(r.clips.id);
    clips.push(r.clips);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <History size={18} className="text-primary" />
        <h1 className="text-xl font-bold">Riwayat Tontonan</h1>
      </div>

      <div className="grid gap-4">
        {clips.map((c) => <ClipCard key={c.id} clip={c} />)}
        {clips.length === 0 && <p className="text-sm text-muted-foreground">Belum ada riwayat tontonan.</p>}
      </div>
    </div>
  );
}
