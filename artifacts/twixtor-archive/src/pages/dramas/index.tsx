import { useListDramas } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Link, useSearch, useLocation } from "wouter";
import { Film, ChevronRight, Folder, ArrowLeft } from "lucide-react";

const ASIA_SUBCATEGORIES = [
  { key: "K-DRAMA", label: "K-Drama" },
  { key: "C-DRAMA", label: "C-Drama" },
  { key: "J-DRAMA", label: "J-Drama" },
  { key: "T-DRAMA", label: "T-Drama" },
  { key: "TAIWAN-DRAMA", label: "Taiwan Drama" },
  { key: "PHILIPPINES-DRAMA", label: "Philippines Drama" },
];

const MAIN_CATEGORIES = [
  { key: "ASIA", label: "ASIA", hasChildren: true },
  { key: "DONGHUA", label: "Donghua", hasChildren: false },
  { key: "ANIME", label: "Anime", hasChildren: false },
  { key: "WESTERN", label: "Western", hasChildren: false },
  { key: "ANIMASI", label: "Animasi", hasChildren: false },
  { key: "MANHWA", label: "Manhwa", hasChildren: false },
  { key: "K-POP", label: "K-Pop", hasChildren: false },
];

type DramaWithCategory = {
  id: number;
  name: string;
  posterUrl?: string | null;
  description?: string | null;
  genre?: string | null;
  category?: string | null;
  subcategory?: string | null;
  videoCount?: number;
  createdAt?: string;
};

export default function Dramas() {
  const search = useSearch();
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(search);
  const categoryParam = params.get("category");
  const subcategoryParam = params.get("subcategory");

  const { data, isLoading } = useListDramas(
    { limit: 100 },
    {
      query: {
        queryKey: ["dramas", "all", 100],
      },
    },
  );

  const dramas = ((data?.dramas ?? []) as unknown as DramaWithCategory[]);

  const selectedCategory = categoryParam?.toUpperCase() || null;
  const selectedSubcategory = subcategoryParam?.toUpperCase() || null;

  const filteredDramas = dramas.filter((drama) => {
    const mainCategory = drama.category?.toUpperCase() || "";
    const subcategory = drama.subcategory?.toUpperCase() || "";

    if (!selectedCategory) return true;

    if (selectedCategory === "ASIA") {
      if (subcategory === selectedSubcategory) return true;

      if (!selectedSubcategory && mainCategory === "ASIA") {
        return true;
      }

      return false;
    }

    return mainCategory === selectedCategory;
  });

  const isAsia = selectedCategory === "ASIA";
  const isSubfolder = isAsia && !!selectedSubcategory;

  const heading =
    isSubfolder
      ? ASIA_SUBCATEGORIES.find(
          (item) => item.key === selectedSubcategory,
        )?.label ?? selectedSubcategory
      : selectedCategory
        ? MAIN_CATEGORIES.find(
            (item) => item.key === selectedCategory,
          )?.label ?? selectedCategory
        : "Semua Drama";

  const goToMainCategory = (category: string) => {
    setLocation(`/dramas?category=${category}`);
  };

  const goToSubcategory = (subcategory: string) => {
    setLocation(`/dramas?category=ASIA&subcategory=${subcategory}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-2">
            {(selectedCategory || selectedSubcategory) && (
              <button
                onClick={() => {
                  if (isSubfolder) {
                    goToMainCategory("ASIA");
                  } else {
                    setLocation("/dramas");
                  }
                }}
                className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <h1 className="font-brand text-3xl tracking-[0.06em] text-white">
              {heading}
            </h1>
          </div>

          {isSubfolder ? (
            <p className="text-sm text-white/35">
              ASIA{" "}
              <ChevronRight className="inline w-3 h-3 mx-1" />
              <span className="text-white/60">{heading}</span>
            </p>
          ) : selectedCategory ? (
            <p className="text-sm text-white/35">
              Menampilkan kategori{" "}
              <span className="text-white/60">{heading}</span>
            </p>
          ) : (
            <p className="text-sm text-white/35">
              Jelajahi koleksi berdasarkan kategori
            </p>
          )}
        </div>

        {/* MAIN CATEGORY FOLDERS */}
        {!selectedCategory && (
          <div className="mb-10">
            <h2 className="text-sm uppercase tracking-[0.18em] text-white/40 mb-4">
              Kategori
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {MAIN_CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  onClick={() => goToMainCategory(category.key)}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all p-5 text-left"
                >
                  <Folder className="w-7 h-7 text-white/50 group-hover:text-white transition mb-4" />

                  <div className="font-semibold text-white">
                    {category.label}
                  </div>

                  {category.hasChildren && (
                    <div className="text-xs text-white/30 mt-1">
                      6 subkategori
                    </div>
                  )}

                  {!category.hasChildren && (
                    <div className="text-xs text-white/30 mt-1">
                      Koleksi
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ASIA SUBFOLDERS */}
        {isAsia && !selectedSubcategory && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Folder className="w-5 h-5 text-white/50" />
              <h2 className="text-sm uppercase tracking-[0.18em] text-white/40">
                ASIA
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {ASIA_SUBCATEGORIES.map((subcategory) => {
                const count = dramas.filter(
                  (drama) =>
                    drama.category?.toUpperCase() === "ASIA" &&
                    drama.subcategory?.toUpperCase() === subcategory.key,
                ).length;

                return (
                  <button
                    key={subcategory.key}
                    onClick={() => goToSubcategory(subcategory.key)}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all p-4 text-left"
                  >
                    <Folder className="w-6 h-6 text-white/40 group-hover:text-white mb-3 transition" />

                    <div className="font-semibold text-white">
                      {subcategory.label}
                    </div>

                    <div className="text-xs text-white/30 mt-1">
                      {count} drama
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DRAMA GRID */}
        {(selectedCategory || !selectedCategory) && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm uppercase tracking-[0.18em] text-white/40">
                {selectedCategory ? heading : "Semua Drama"}
              </h2>

              <span className="text-xs text-white/30">
                {filteredDramas.length} drama
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredDramas.length === 0 ? (
              <div className="text-center py-24 text-white/30">
                <Film className="h-12 w-12 mx-auto mb-4 opacity-30" />

                <p className="text-lg">
                  Belum ada drama di kategori ini
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredDramas.map((drama) => (
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
                      <h3 className="font-heading text-base text-white line-clamp-2 leading-tight">
                        {drama.name}
                      </h3>

                      <p className="text-xs text-white/60 mt-1">
                        {drama.subcategory
                          ? `${drama.category} • ${drama.subcategory}`
                          : drama.category ?? ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
