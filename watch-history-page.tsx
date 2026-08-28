import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon } from "lucide-react";

const API_BASE = "https://quart-shallow-frog.abasthan.app";

async function fetchWatchHistory() {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/watch-history`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat riwayat tontonan");
  return res.json();
}

export default function WatchHistory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["watch-history"],
    queryFn: fetchWatchHistory,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <HistoryIcon className="h-7 w-7 text-primary" />
          Riwayat Tontonan
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.map((video: any) => <VideoCard key={video.id} video={video} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Belum ada video yang ditonton</p>
            <Link href="/videos" className="text-primary hover:text-primary/80 text-sm mt-2 block">Jelajahi clips</Link>
          </div>
        )}
      </main>
    </div>
  );
}
