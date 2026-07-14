import { useListVideos } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Videos() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListVideos({ search, limit: 24 });

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-brand text-3xl tracking-[0.06em] text-white">Browse Videos</h1>
            {search && <p className="text-sm text-white/35 mt-1">Hasil pencarian untuk "<span className="text-white/60">{search}</span>"</p>}
          </div>
          <div className="w-full md:w-72">
            <Input 
              placeholder="Cari video..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/35 focus-visible:ring-white/30 h-10 rounded-xl"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : data?.videos.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/30 text-lg mb-2">Tidak ada video ditemukan</p>
            {search && <p className="text-white/20 text-sm">Coba kata kunci lain</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {data?.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
