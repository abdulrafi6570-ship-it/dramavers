import { useGetActor, getGetActorQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { Link, useParams } from "wouter";
import { ArrowLeft, UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function ActorDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: actor, isLoading } = useGetActor(id, { query: { queryKey: getGetActorQueryKey(id), enabled: !!id } });

  const [isFollowed, setIsFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (actor) {
      setIsFollowed(!!(actor as any).isFollowed);
      setFollowerCount((actor as any).followerCount ?? 0);
    }
  }, [actor]);

  const token = () => localStorage.getItem("twixtor_token");

  async function handleFollow() {
    if (!user) return;
    setFollowLoading(true);
    try {
      if (isFollowed) {
        const res = await fetch(`/api/follows/actors/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        setIsFollowed(false);
        setFollowerCount(data.followerCount ?? Math.max(0, followerCount - 1));
      } else {
        const res = await fetch(`/api/follows/actors/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        setIsFollowed(true);
        setFollowerCount(data.followerCount ?? followerCount + 1);
      }
      qc.invalidateQueries({ queryKey: getGetActorQueryKey(id) });
    } finally {
      setFollowLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8">
          <div className="h-40 rounded-2xl bg-white/5 animate-pulse mb-8" />
        </main>
      </div>
    );
  }

  if (!actor) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <Link href="/actors" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">All Actors</span>
        </Link>

        <div className="relative overflow-hidden rounded-2xl glass-panel p-6 md:p-8 mb-8">
          <div className="flex gap-6 flex-wrap">
            <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-primary/40 neon-glow-purple">
              {actor.photoUrl
                ? <img src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-black/60 flex items-center justify-center text-white/30 text-3xl font-bold">{actor.name.charAt(0)}</div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-2xl md:text-4xl text-white mb-2">{actor.name}</h1>

              <div className="flex items-center gap-4 mb-3">
                <span className="text-white/50 text-sm">{actor.videoCount} clips</span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/50 text-sm">
                  <span className="text-white font-semibold">{followerCount}</span> pengikut
                </span>
              </div>

              {user && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                    isFollowed
                      ? "bg-primary/20 border-primary/60 text-primary hover:bg-red-500/20 hover:border-red-400/60 hover:text-red-400"
                      : "bg-white/10 border-white/20 text-white hover:bg-primary/20 hover:border-primary/60 hover:text-primary"
                  } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isFollowed
                    ? <><UserCheck className="h-4 w-4" />Mengikuti</>
                    : <><UserPlus className="h-4 w-4" />Ikuti</>
                  }
                </button>
              )}

              {actor.dramas && actor.dramas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {actor.dramas.map((d) => (
                    <Link key={d.id} href={`/dramas/${d.id}`}>
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60 hover:bg-primary/20 hover:text-primary border border-white/10 transition-colors cursor-pointer">{d.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <section>
          <h2 className="font-heading text-xl text-white mb-4">Clips</h2>
          {actor.videos && actor.videos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {actor.videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-white/40">No clips available yet</div>
          )}
        </section>
      </main>
    </div>
  );
}
