import { useListDownloads, getListDownloadsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Download } from "lucide-react";

export default function History() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useListDownloads({}, { query: { queryKey: getListDownloadsQueryKey(), enabled: !!user } });

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Download className="h-7 w-7 text-primary" />
          Download History
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.map((item) => <VideoCard key={item.id} video={item.video} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No downloads yet</p>
            <Link href="/videos" className="text-primary hover:text-primary/80 text-sm mt-2 block">Browse clips</Link>
          </div>
        )}
      </main>
    </div>
  );
}
