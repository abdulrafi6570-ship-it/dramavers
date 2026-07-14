import { useListFavorites, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Heart } from "lucide-react";

export default function Favorites() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: videos, isLoading } = useListFavorites({ query: { queryKey: getListFavoritesQueryKey(), enabled: !!user } });

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Heart className="h-7 w-7 text-red-400 fill-red-400" />
          Favorites
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {videos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No favorites yet</p>
            <Link href="/videos" className="text-primary hover:text-primary/80 text-sm mt-2 block">Browse clips</Link>
          </div>
        )}
      </main>
    </div>
  );
}
