import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import FavoritesGallery3D from "@/components/favorites-gallery-3d";

const API_BASE = "https://quart-shallow-frog.abasthan.app";

interface FavoriteDrama {
  id: number;
  name: string;
  posterUrl?: string | null;
}

async function fetchFavoriteDramas(): Promise<FavoriteDrama[]> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/drama-favorites`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat drama favorit");
  return res.json();
}

async function removeFavoriteDrama(dramaId: number): Promise<void> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/drama-favorites/${dramaId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal menghapus favorit");
}

type AspectRatio = "1:1" | "9:16" | "16:9";

const ASPECT_CONFIG: Record<AspectRatio, { label: string; className: string; cols: number }> = {
  "1:1": { label: "1:1", className: "aspect-square", cols: 2 },
  "9:16": { label: "9:16", className: "aspect-[9/16]", cols: 1 },
  "16:9": { label: "16:9", className: "aspect-[16/9]", cols: 3 },
};

export default function Favorites() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: dramas, isLoading } = useQuery({
    queryKey: ["drama-favorites"],
    queryFn: fetchFavoriteDramas,
    enabled: !!user,
  });

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user]);

  const handleUnfavorite = async (dramaId: number) => {
    await removeFavoriteDrama(dramaId);
    queryClient.invalidateQueries({ queryKey: ["drama-favorites"] });
  };

  const topFavorites = (dramas ?? []).slice(0, 5);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `favorit-drama-twixtor-${aspectRatio.replace(":", "x")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Heart className="h-7 w-7 text-red-400 fill-red-400" />
          Favorites
        </h1>

        {isLoading ? (
          <div className="h-[65vh] min-h-[420px] rounded-2xl bg-white/5 animate-pulse mb-10" />
        ) : dramas && dramas.length > 0 ? (
          <>
            <section className="mb-10">
              <FavoritesGallery3D dramas={dramas} onUnfavorite={handleUnfavorite} />
            </section>

            <div className="mb-10 glass-panel rounded-2xl p-4 md:p-6 border-white/10">
              <h2 className="text-white font-semibold mb-1">Kartu Favorit</h2>
              <p className="text-xs text-white/40 mb-4">Bikin gambar berisi {topFavorites.length} drama favorit teratas kamu, siap di-download</p>

              <div className="flex gap-2 mb-4">
                {(Object.keys(ASPECT_CONFIG) as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      aspectRatio === ratio
                        ? "bg-primary text-black border-primary"
                        : "bg-black/30 text-white/60 border-white/10 hover:text-white"
                    }`}
                  >
                    {ASPECT_CONFIG[ratio].label}
                  </button>
                ))}
              </div>

              <div className="flex justify-center mb-4">
                <div
                  ref={cardRef}
                  className={`w-full max-w-sm bg-black relative overflow-hidden rounded-xl ${ASPECT_CONFIG[aspectRatio].className}`}
                >
                  <div
                    className="absolute inset-0 grid gap-1 p-2"
                    style={{ gridTemplateColumns: `repeat(${ASPECT_CONFIG[aspectRatio].cols}, 1fr)` }}
                  >
                    {topFavorites.map((drama) => (
                      <div key={drama.id} className="relative rounded-md overflow-hidden bg-white/5">
                        {drama.posterUrl && (
                          <img
                            src={drama.posterUrl}
                            crossOrigin="anonymous"
                            className="absolute inset-0 w-full h-full object-cover"
                            alt={drama.name}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                        <span className="absolute bottom-1 left-1 right-1 text-[9px] font-medium text-white line-clamp-2">{drama.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-2 left-2 text-[9px] font-bold tracking-widest text-white/70 uppercase">Twixtor Archive</div>
                  <div className="absolute bottom-2 right-2 text-[8px] text-white/50">@{user?.username}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || topFavorites.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-primary text-black font-medium text-sm py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? "Membuat gambar..." : "Download sebagai gambar"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-white/40">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Belum ada drama favorit</p>
            <Link href="/dramas" className="text-primary hover:text-primary/80 text-sm mt-2 block">Jelajahi drama</Link>
          </div>
        )}
      </main>
    </div>
  );
}
