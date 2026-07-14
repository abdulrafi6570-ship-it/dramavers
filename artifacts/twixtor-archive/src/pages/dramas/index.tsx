import { useListDramas, getListDramasQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { Film } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  kdrama: "K-Drama",
  cdrama: "C-Drama",
  anime: "Anime",
  indo: "Indo",
  series: "Series",
  film_barat: "Film Barat",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

export default function Dramas() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const category = params.get("category") ?? undefined;

  const { data, isLoading } = useListDramas(
    { limit: 100, category },
    { query: { queryKey: getListDramasQueryKey({ limit: 100, category }) } }
  );

  const heading = category ? (CATEGORY_LABELS[category] ?? category) : "Semua Drama";

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-7">
          <h1 className="font-brand text-3xl tracking-[0.06em] text-white mb-1">{heading}</h1>
          {category && (
            <p className="text-sm text-white/35">
              Menampilkan drama kategori <span className="text-white/60">{CATEGORY_LABELS[category] ?? category}</span>
            </p>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setLocation("/dramas")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !category
                ? "bg-white text-black border-white"
                : "border-white/15 text-white/45 hover:text-white hover:border-white/35 bg-transparent"
            }`}
          >
            Semua
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setLocation(`/dramas?category=${cat}`)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                category === cat
                  ? "bg-white text-black border-white"
                  : "border-white/15 text-white/45 hover:text-white hover:border-white/35 bg-transparent"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : data?.dramas.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <Film className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Belum ada drama di kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {data?.dramas.map((drama) => (
              <Link
                key={drama.id}
                href={`/dramas/${drama.id}`}
                className="group relative aspect-[2/3] overflow-hidden rounded-xl glass-panel block border-white/5 hover:border-primary/50 transition-all hover:neon-glow-purple duration-300"
              >
                {drama.posterUrl ? (
                  <img
                    src={drama.posterUrl}
                    alt={drama.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-black/60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-heading text-base text-white line-clamp-2 leading-tight">{drama.name}</h3>
                  <p className="text-xs text-white/60 mt-1">{CATEGORY_LABELS[drama.category] ?? drama.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
