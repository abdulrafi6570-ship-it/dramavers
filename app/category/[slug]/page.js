export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';



export default async function CategoryPage({ params, searchParams }) {
  const db = supabaseAdmin();
    const { data: allCategories } = await db
    .from('categories')
    .select('id, name, slug')
    .order('sort_order', { ascending: true });

  const { data: category, error: categoryError } = await db
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (categoryError) {
    console.error('Category error:', categoryError);
  }

  if (!category) {
    return (
      <div className="py-10">
        <h1 className="text-xl font-bold">
          Kategori tidak ditemukan
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Slug kategori: {params.slug}
        </p>
      </div>
    );
  }

  const { data: subcategories } = await db
    .from('subcategories')
    .select('*')
    .eq('category_id', category.id)
    .order('sort_order', { ascending: true });

  const activeSub =
    typeof searchParams?.sub === 'string'
      ? searchParams.sub
      : null;

  /*
   * Ambil semua drama milik kategori ini.
   *
   * Contoh:
   * /category/asia
   * → semua drama ASIA
   *
   * /category/asia?sub=xxxxx
   * → drama ASIA yang punya subcategory tersebut
   */

  let dramaQuery = db
    .from('dramas')
    .select(`
      id,
      title,
      poster_url,
      category_id,
      subcategory_id,
      created_at,
      subcategories (
        id,
        name,
        slug
      )
    `)
    .eq('category_id', category.id);

  if (activeSub) {
    dramaQuery = dramaQuery.eq(
      'subcategory_id',
      activeSub
    );
  }

  const {
    data: dramas,
    error: dramaError,
  } = await dramaQuery.order('created_at', {
    ascending: false,
  });

  if (dramaError) {
    console.error('Drama query error:', dramaError);
  }

  /*
   * Ambil jumlah klip untuk setiap drama.
   * Ini bukan syarat tampil, cuma supaya kita bisa
   * kasih informasi jumlah video.
   */

  const dramaIds = (dramas || []).map((d) => d.id);

  let clips = [];

  if (dramaIds.length > 0) {
    const { data: clipData } = await db
      .from('clips')
      .select('id, drama_id')
      .in('drama_id', dramaIds);

    clips = clipData || [];
  }

  const clipCount = {};

  clips.forEach((clip) => {
    clipCount[clip.drama_id] =
      (clipCount[clip.drama_id] || 0) + 1;
  });

  return (
    <div className="space-y-6">

      {/* Header */}

            <h1 className="text-2xl font-bold">
        {category.name}
      </h1>

    

      {/* Subcategories */}

      {subcategories && subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">

          <Link
            href={`/category/${category.slug}`}
            className={[
              'rounded-full border px-4 py-2 text-sm font-semibold transition',
              !activeSub
                ? 'border-primary bg-primary text-white'
                : 'border-border text-muted-foreground hover:border-primary/60',
            ].join(' ')}
          >
            Semua
          </Link>

          {subcategories.map((sub) => {
            const active = activeSub === sub.id;

            return (
              <Link
                key={sub.id}
                href={`/category/${category.slug}?sub=${sub.id}`}
                className={[
                  'rounded-full border px-4 py-2 text-sm font-semibold transition',
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-border text-muted-foreground hover:border-primary/60',
                ].join(' ')}
              >
                {sub.name}
              </Link>
            );
          })}

        </div>
      )}

      {/* Info */}

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-muted-foreground">
            {activeSub
              ? subcategories?.find(
                  (s) => s.id === activeSub
                )?.name || 'Subkategori'
              : `Semua ${category.name}`}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          {dramas?.length || 0} drama
        </p>

      </div>

      {/* Drama Grid */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">

        {dramas?.map((drama) => {
          const totalClips =
            clipCount[drama.id] || 0;

          return (
            <Link
              key={drama.id}
              href={`/drama/${drama.id}`}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/50"
            >

              <div className="relative aspect-[2/3] overflow-hidden bg-muted">

                {drama.poster_url ? (
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

                {totalClips > 0 && (
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    {totalClips} video
                    {totalClips > 1 ? 's' : ''}
                  </div>
                )}

              </div>

              <div className="p-2.5">

                <p className="truncate text-sm font-semibold">
                  {drama.title}
                </p>

                {drama.subcategories?.name && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {drama.subcategories.name}
                  </p>
                )}

              </div>

            </Link>
          );
        })}

      </div>

      {/* Empty */}

      {(!dramas || dramas.length === 0) && (
        <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">

          <p className="font-semibold">
            Belum ada drama di sini
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {activeSub
              ? 'Belum ada drama yang masuk ke subkategori ini.'
              : `Belum ada drama yang masuk ke kategori ${category.name}.`}
          </p>

        </div>
      )}

    </div>
  );
}