export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { User, Film } from 'lucide-react';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import ClipCard from '../../../components/ClipCard';

export default async function ActorDetailPage({ params }) {
  const { id } = params;
  const db = supabaseAdmin();

  const { data: actor } = await db
    .from('actors')
    .select('*')
    .eq('id', id)
    .single();

  if (!actor) notFound();

  // Mengambil klip yang terkait dengan aktor ini beserta info dramanya
  const { data: rows } = await db
    .from('clip_actors')
    .select('clips(*, dramas(id, title))')
    .eq('actor_id', id);

  let clips = (rows || []).map((r) => r.clips).filter(Boolean);

  // Fallback jika relasi disimpan melalui drama_actors
  if (clips.length === 0) {
    const { data: dramaRows } = await db
      .from('drama_actors')
      .select('drama_id')
      .eq('actor_id', id);

    const dramaIds = (dramaRows || []).map((r) => r.drama_id).filter(Boolean);
    if (dramaIds.length > 0) {
      const { data: dramaClips } = await db
        .from('clips')
        .select('*, dramas(id, title)')
        .in('drama_id', dramaIds)
        .order('created_at', { ascending: false });
      clips = dramaClips || [];
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Profil Aktor */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-3xl border-[3px] border-border bg-card p-5 shadow-neo">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-[3px] border-border bg-muted shadow-neo-sm">
          {actor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={actor.photo_url}
              alt={actor.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <User size={36} />
            </div>
          )}
        </div>

        <div className="text-center sm:text-left space-y-1.5">
          <h1 className="text-2xl font-extrabold">{actor.name}</h1>
          {actor.bio && (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {actor.bio}
            </p>
          )}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-muted px-3 py-0.5 text-xs font-bold">
              <Film size={12} className="text-primary" />
              {clips.length} Klip Tersedia
            </span>
          </div>
        </div>
      </div>

      {/* Daftar Klip Aktor */}
      {clips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} drama={clip.dramas} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Belum ada klip untuk aktor ini.
        </p>
      )}
    </div>
  );
}