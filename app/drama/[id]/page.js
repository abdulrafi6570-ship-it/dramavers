export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Film, ExternalLink } from 'lucide-react';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import ClipCard from '../../../components/ClipCard';
import ExpandableText from '../../../components/ExpandableText';
import ShareToChat from '../../../components/ShareToChat';
import UnlockBanner from '../../../components/UnlockBanner';
import Badge from '../../../components/ui/badge';
import Avatar from '../../../components/ui/avatar';

export default async function DramaPage({ params }) {
  const db = supabaseAdmin();

  const { data: drama } = await db
    .from('dramas')
    .select('*, categories(name, slug), subcategories(name)')
    .eq('id', params.id)
    .maybeSingle();

  if (!drama) return <p className="text-muted-foreground">Drama tidak ditemukan.</p>;

  const { data: clips } = await db.from('clips').select('*').eq('drama_id', drama.id).order('created_at');

  const { data: actorLinks } = await db
    .from('drama_actors')
    .select('actors(id, name, photo_url)')
    .eq('drama_id', drama.id);

  const actors = actorLinks?.map((l) => l.actors) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-40 shrink-0">
          <div className="aspect-[2/3] card overflow-hidden">
            {drama.poster_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={drama.poster_url} alt={drama.title} className="w-full h-full object-cover" />
            )}
          </div>
        </div>
               <div className="min-w-0 flex-1 space-y-3">
          <div className="flex gap-2">
            {drama.categories?.name && <Badge>{drama.categories.name}</Badge>}
            {drama.subcategories?.name && <Badge variant="secondary">{drama.subcategories.name}</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{drama.title}</h1>
                    {drama.description?.trim() && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Sinopsis
              </p>
              <ExpandableText
                text={drama.description}
                className="text-sm leading-7 text-foreground/85 sm:text-[15px]"
              />
            </div>
          )}

          {actors.length > 0 && (
            <div className="flex gap-3 flex-wrap pt-2">
              {actors.map((a) => (
                <Link key={a.id} href={`/actor/${a.id}`} className="flex items-center gap-2 card px-2 py-1.5 hover:border-primary/60 transition">
                  <Avatar size={28} src={a.photo_url} alt={a.name} />
                  <span className="text-sm">{a.name}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
  {/^https?:\/\//i.test(drama.scp_url || '') && (
    <a
      href={drama.scp_url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary inline-flex items-center gap-1.5 text-sm"
    >
      SCP
      <ExternalLink size={14} />
    </a>
  )}
  <ShareToChat dramaId={drama.id} dramaTitle={drama.title} />
</div>
        </div>
      </div>

      <UnlockBanner />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Film size={16} className="text-primary" />
          <h2 className="font-bold">Klip ({clips?.length || 0})</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {clips?.map((c) => <ClipCard key={c.id} clip={c} />)}
          {(!clips || clips.length === 0) && <p className="text-muted-foreground text-sm">Belum ada klip.</p>}
        </div>
      </div>
    </div>
  );
}
