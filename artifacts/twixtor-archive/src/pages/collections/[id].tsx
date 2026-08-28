import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation, useParams } from "wouter";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FolderHeart, X, Loader2 } from "lucide-react";

const API_BASE = "https://quart-shallow-frog.abasthan.app";

async function fetchCollection(id: number) {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/collections/${id}`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Gagal memuat koleksi");
  return res.json();
}

async function removeVideoFromCollection(collectionId: number, videoId: number) {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/collections/${collectionId}/videos/${videoId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal menghapus video dari koleksi");
}

export default function CollectionDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["collection", id],
    queryFn: () => fetchCollection(id),
    enabled: !!user && !!id,
  });

  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user]);

  const handleRemove = async (videoId: number) => {
    setRemovingId(videoId);
    try {
      await removeVideoFromCollection(id, videoId);
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8">
          <div className="h-8 w-48 rounded bg-white/5 animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <Link href="/collections" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Koleksi Saya</span>
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <FolderHeart className="h-7 w-7 text-primary" />
          {data.name}
        </h1>

        {data.videos && data.videos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.videos.map((video: any) => (
              <div key={video.id} className="relative">
                <VideoCard video={video} />
                <button
                  type="button"
                  onClick={() => handleRemove(video.id)}
                  disabled={removingId === video.id}
                  aria-label="Hapus dari koleksi"
                  className="absolute top-2 left-2 z-10 h-7 w-7 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {removingId === video.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <X className="h-3.5 w-3.5 text-white" />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            <FolderHeart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Koleksi ini masih kosong</p>
            <Link href="/videos" className="text-primary hover:text-primary/80 text-sm mt-2 block">Jelajahi clips</Link>
          </div>
        )}
      </main>
    </div>
  );
}
