export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';
import ReelItem from '../../components/ReelItem';
import Link from 'next/link';
import { Film, ArrowLeft } from 'lucide-react';

export default async function FypReelsPage() {
  const db = supabaseAdmin();

  const { data: clips } = await db
    .from('clips')
    .select('*, dramas(id, title)')
    .order('created_at', { ascending: false })
    .limit(20);

  const clipList = clips || [];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Top Bar / Header Transparan */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent text-white pointer-events-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-bold backdrop-blur-md border border-white/20 hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </Link>
        <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-wide">
          <Film size={16} className="text-primary" />
          <span>FYP Reels</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Container Snap Scroll */}
      <div className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-none w-full h-full">
        {clipList.length > 0 ? (
          clipList.map((clip) => (
            <ReelItem key={clip.id} clip={clip} />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            Belum ada klip yang tersedia.
          </div>
        )}
      </div>
    </div>
  );
}