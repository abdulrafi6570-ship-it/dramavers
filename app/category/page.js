export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabaseAdmin } from '../../lib/supabaseAdmin';


export default async function AllVideosPage() {
  const db = supabaseAdmin();

  const { data: categories } = await db
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true });

  // SEMUA drama, termasuk yang kategorinya kosong
  const { data: dramas, error } = await db
    .from('dramas')
    .select('id, title, poster_url, category_id, created_at, categories(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('All dramas error:', error);
  }

  // Jumlah klip per drama
  const dramaIds = (dramas || []).map((d) => d.id);
  const clipCount = {};

  if (dramaIds.length > 0) {
    const { data: clips } = await db
      .from('clips')
      .select('id, drama_id')
      .in('drama_id', dramaIds);

    (clips || []).forEach((c) => {
      clipCount[c.drama_id] = (clipCount[c.drama_id] || 0) + 1;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Semua Video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dramas?.length || 0} drama dari semua kategori
        </p>
      </div>

      

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {dramas?.map((drama) => {
          const total = clipCount[drama.id] || 0;

          return (
            <Link
              key={drama.id}
              href={`/drama/${drama.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                {drama.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={drama.poster_url}
                    alt={drama.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No Poster
                  </div>
                )}

                {total > 0 && (
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    {total} video{total > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="p-2.5">
                <p className="truncate text-sm font-semibold">{drama.title}</p>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">
                  {drama.categories?.name || 'Tanpa kategori'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {(!dramas || dramas.length === 0) && (
        <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
          <p className="font-semibold">Belum ada drama</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan drama lewat Panel Admin, lalu upload klipnya.
          </p>
        </div>
      )}
    </div>
  );
}