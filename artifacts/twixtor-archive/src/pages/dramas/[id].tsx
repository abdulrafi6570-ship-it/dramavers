import { useGetDrama, getGetDramaQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

interface Video {
  id: number; title: string; thumbnailUrl?: string | null; type: string;
  viewCount: number; downloadCount: number; dramaName?: string | null; actorName?: string | null;
  isFavorited?: boolean | null; isBookmarked?: boolean | null;
}

interface Actor {
  id: number; name: string; photoUrl?: string | null;
}

export default function DramaDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: drama, isLoading } = useGetDrama(id, { query: { queryKey: getGetDramaQueryKey(id), enabled: !!id } });

  const [actorTab, setActorTab] = useState<number | null>(null);
  const [actorVideos, setActorVideos] = useState<Record<number, Video[]>>({});
  const [loadingActor, setLoadingActor] = useState<number | null>(null);

  useEffect(() => {
    if (drama?.actors && drama.actors.length > 0 && actorTab === null) {
      setActorTab(drama.actors[0].id);
    }
  }, [drama?.actors]);

  useEffect(() => {
    if (!actorTab || actorVideos[actorTab] !== undefined) return;
    setLoadingActor(actorTab);
    fetch(`/api/videos?actorId=${actorTab}&dramaId=${id}&limit=30`)
      .then((r) => r.json())
      .then((data) => {
        setActorVideos((prev) => ({ ...prev, [actorTab]: data.videos ?? [] }));
      })
      .finally(() => setLoadingActor(null));
  }, [actorTab, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8">
          <div className="h-48 rounded-2xl bg-white/5 animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!drama) return null;

  const actors = (drama.actors ?? []) as Actor[];
  const dramaVideos = (drama.videos ?? []) as Video[];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <Link href="/dramas" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">All Dramas</span>
        </Link>

        {/* Drama info header */}
        <div className="relative overflow-hidden rounded-2xl glass-panel p-6 md:p-8 mb-8">
          <div className="flex gap-6 md:gap-8">
            {drama.posterUrl && (
              <div className="flex-shrink-0 w-28 md:w-40 aspect-[2/3] rounded-xl overflow-hidden">
                <img src={drama.posterUrl} alt={drama.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {drama.category && (
                  <span className="text-xs font-bold px-2 py-1 rounded bg-primary/30 text-primary border border-primary/40 uppercase tracking-wide">
                    {drama.category.replace("_", " ")}
                  </span>
                )}
                {drama.genre && (
                  <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60 border border-white/10">
                    {drama.genre}
                  </span>
                )}
              </div>
              <h1 className="font-heading text-2xl md:text-4xl text-white mb-3">{drama.name}</h1>
              {drama.description && (
                <p className="text-white/60 text-sm md:text-base leading-relaxed line-clamp-3">{drama.description}</p>
              )}
              <p className="mt-3 text-white/40 text-sm">{drama.videoCount} clips available</p>
            </div>
          </div>
        </div>

        {/* Cast section */}
        {actors.length > 0 && (
          <section className="mb-10">
            <h2 className="font-heading text-xl text-white mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {actors.map((actor) => (
                <Link key={actor.id} href={`/actors/${actor.id}`} className="group flex-shrink-0 flex flex-col items-center gap-2 w-20">
                  <div className="w-16 h-16 rounded-full overflow-hidden glass-panel border-white/10 group-hover:border-primary/50 transition-all">
                    {actor.photoUrl
                      ? <img src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/30 font-bold">{actor.name.charAt(0)}</div>
                    }
                  </div>
                  <span className="text-xs text-white/60 text-center group-hover:text-white transition-colors line-clamp-2">{actor.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All drama clips */}
        {dramaVideos.length > 0 && (
          <section className="mb-10">
            <h2 className="font-heading text-xl text-white mb-4">Semua Clips ({drama.videoCount})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {dramaVideos.map((video) => (
                <VideoCard key={video.id} video={video as any} />
              ))}
            </div>
          </section>
        )}

        {/* Actor video tabs — show actor-specific clips */}
        {actors.length > 0 && (
          <section>
            <h2 className="font-heading text-xl text-white mb-4">Clips per Aktor</h2>

            {/* Actor tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {actors.map((actor) => (
                <button
                  key={actor.id}
                  onClick={() => setActorTab(actor.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                    actorTab === actor.id
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
                  }`}
                >
                  {actor.photoUrl && (
                    <img src={actor.photoUrl} alt={actor.name} className="w-5 h-5 rounded-full object-cover" />
                  )}
                  {actor.name}
                </button>
              ))}
            </div>

            {/* Videos for selected actor */}
            {actorTab && (
              <>
                {loadingActor === actorTab ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />)}
                  </div>
                ) : (actorVideos[actorTab]?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {actorVideos[actorTab].map((video) => (
                      <VideoCard key={video.id} video={video as any} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-white/30 text-sm">
                    Belum ada clip untuk aktor ini di drama ini
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Fallback when no clips and no actors */}
        {dramaVideos.length === 0 && actors.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <p>No clips available yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
