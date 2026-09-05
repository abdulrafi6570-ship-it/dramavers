import { useGetHome } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { HandWrittenTitle } from "@/components/ui/hand-writing-text";
import { Link, useLocation } from "wouter";
import { Film, Users, Play, Music } from "lucide-react";
import Folder from "@/components/Folder";
import DomeGallery from "@/components/DomeGallery";
import Counter from "@/components/Counter";
import CardSwap, { Card } from "@/components/CardSwap";
import Carousel from "@/components/Carousel";
import BorderGlow from "@/components/BorderGlow";
import { useEffect, useRef, useState } from "react";

const CATEGORIES = [
  { key: "ASIA", label: "ASIA", color: "#a855f7", hasChildren: true },
  { key: "DONGHUA", label: "DONGHUA", color: "#ec4899", hasChildren: false },
  { key: "ANIME", label: "ANIME", color: "#3b82f6", hasChildren: false },
  { key: "WESTERN", label: "WESTERN", color: "#f59e0b", hasChildren: false },
  { key: "ANIMASI", label: "ANIMASI", color: "#22c55e", hasChildren: false },
  { key: "MANHWA", label: "MANHWA", color: "#6366f1", hasChildren: false },
  { key: "K-POP", label: "K-POP", color: "#ef4444", hasChildren: false },
];

// DomeGallery builds dozens of CSS 3D-transformed tiles, and each one
// becomes its own GPU compositor layer. Mounting two of them immediately
// on page load is what pegs the GPU (and drags the whole system down with
// it, not just the browser tab). This hook delays mounting until the
// section is actually about to scroll into view, so the initial page
// load never has to pay that cost at all.
function useInView(rootMargin = "300px") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView] as const;
}

function GalleryPlaceholder({ images }: { images: string[] }) {
  return (
    <div className="w-full h-full grid grid-cols-4 gap-1 p-1.5 opacity-50">
      {images.slice(0, 8).map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover rounded-md"
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { data, isLoading } = useGetHome();
  const [, setLocation] = useLocation();

  const posterUrls = (data?.featuredDramas ?? [])
    .map((d: any) => d.posterUrl)
    .filter(Boolean)
    .slice(0, 24) as string[];

  const soloActorPhotos = ((data as any)?.featuredSoloActors ?? [])
    .map((a: any) => a.photoUrl)
    .filter(Boolean)
    .slice(0, 24) as string[];

  const hasDomeGallery = posterUrls.length >= 3;
  const hasSoloGallery = soloActorPhotos.length >= 3;

  const [domeRef, domeInView] = useInView();
  const [soloRef, soloInView] = useInView();

  const videoItems = (data?.recentVideos ?? [])
    .slice(0, 8)
    .map((v: any) => ({
      id: v.id,
      title: v.title,
      description: v.dramaName ?? v.actorName ?? "Twixtor Clip",
      coverUrl: v.thumbnailUrl ?? null,
      icon: <Play size={14} />,
    }));

  const stats = data?.stats;
  const featuredDramas = data?.featuredDramas ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0 overflow-x-hidden">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Hero */}
        <div className="mb-6">
          <HandWrittenTitle title="TWIXTOR" subtitle="Archive" />

          <div className="flex items-center justify-between gap-3 -mt-2">
            {stats && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Film className="h-3 w-3 text-white/30 flex-shrink-0" />
                  <span className="text-[15px] font-extrabold text-white/90">{stats.totalDramas}</span>
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Dramas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-white/30 flex-shrink-0" />
                  <span className="text-[15px] font-extrabold text-white/90">{stats.totalActors}</span>
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Aktor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-white/30 flex-shrink-0" />
                  <span className="text-[15px] font-extrabold text-white/90">{stats.totalVideos}</span>
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Clips</span>
                </div>
              </div>
            )}

            {featuredDramas.length >= 2 && (
              <div className="flex-shrink-0 flex gap-1.5" style={{ width: 112, height: 158 }}>
                {featuredDramas.slice(0, 2).map((drama: any) => (
                  <button
                    key={drama.id}
                    type="button"
                    onClick={() => setLocation(`/dramas/${drama.id}`)}
                    className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-black/40"
                  >
                    {drama.posterUrl ? (
                      <img
                        src={drama.posterUrl}
                        alt={drama.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-1.5">
                        <Film className="h-5 w-5 text-white/20" />
                        <span className="text-[10px] text-white/50 text-center leading-tight">{drama.name}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drama Gallery */}
        {hasDomeGallery && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-base font-semibold text-white">
                Drama Collection
              </h2>
              <Link href="/dramas" className="text-xs text-white/40 hover:text-white transition-colors">
                Lihat semua →
              </Link>
            </div>

            <div
              ref={domeRef}
              className="rounded-2xl overflow-hidden border border-white/8"
              style={{ height: "340px" }}
            >
              {domeInView ? (
                <DomeGallery
                  images={posterUrls}
                  segments={16}
                  maxVerticalRotationDeg={11}
                  minRadius={500}
                  overlayBlurColor="#080808"
                  grayscale={false}
                  imageBorderRadius="14px"
                  openedImageBorderRadius="18px"
                  openedImageWidth="220px"
                  openedImageHeight="310px"
                />
              ) : (
                <GalleryPlaceholder images={posterUrls} />
              )}
            </div>

            <p className="text-center text-[10px] text-white/20 mt-1.5">
              Drag untuk menjelajahi
            </p>
          </section>
        )}

        {/* Solo Artists Gallery */}
        {hasSoloGallery && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-white/40" />
                <h2 className="font-heading text-base font-semibold text-white">
                  Solo Artists
                </h2>
              </div>
              <Link href="/actors?tab=solo" className="text-xs text-white/40 hover:text-white transition-colors">
                Lihat semua →
              </Link>
            </div>

            <div
              ref={soloRef}
              className="rounded-2xl overflow-hidden border border-white/8"
              style={{ height: "300px" }}
            >
              {soloInView ? (
                <DomeGallery
                  images={soloActorPhotos}
                  segments={16}
                  maxVerticalRotationDeg={9}
                  minRadius={450}
                  overlayBlurColor="#080808"
                  grayscale={false}
                  imageBorderRadius="50%"
                  openedImageBorderRadius="50%"
                  openedImageWidth="200px"
                  openedImageHeight="200px"
                />
              ) : (
                <GalleryPlaceholder images={soloActorPhotos} />
              )}
            </div>

            <p className="text-center text-[10px] text-white/20 mt-1.5">
              Drag untuk menjelajahi
            </p>
          </section>
        )}

        {/* Browse by Category */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-base font-semibold text-white">
              Browse by Category
            </h2>
            <Link href="/dramas" className="text-xs text-white/40 hover:text-white transition-colors">
              Lihat semua →
            </Link>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  if (cat.key === "ASIA") {
                    setLocation("/dramas?category=ASIA");
                    return;
                  }
                  setLocation(`/dramas?category=${cat.key}`);
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex items-center justify-center" style={{ height: 90 }}>
                  <Folder color={cat.color} size={52} strokeWidth={1.8} />
                </div>
                <span className="font-bouncy text-[11px] text-white/60 group-hover:text-white transition-colors text-center">
                  {cat.label}
                </span>
                {cat.hasChildren && (
                  <span className="text-[9px] text-white/25">6 subkategori</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Dramas */}
        {featuredDramas.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-base font-semibold text-white">Dramas</h2>
              <Link href="/dramas" className="text-xs text-white/40 hover:text-white transition-colors">
                Lihat semua →
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {featuredDramas.map((drama: any) => (
                <Link key={drama.id} href={`/dramas/${drama.id}`} className="flex-shrink-0 w-28 md:w-36 group">
                  <div className="w-28 h-40 md:w-36 md:h-52 rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-primary/40 transition-colors">
                    {drama.posterUrl ? (
                      <img
                        src={drama.posterUrl}
                        alt={drama.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl font-bold">
                        {drama.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/70 group-hover:text-white transition-colors truncate">
                    {drama.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Clips */}
        {videoItems.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold text-white">Recent Clips</h2>
              <Link href="/videos" className="text-xs text-white/40 hover:text-white transition-colors">
                See all →
              </Link>
            </div>

            <div className="-mx-4 md:-mx-6">
              <Carousel
                items={videoItems}
                baseWidth={typeof window !== "undefined" ? window.innerWidth : 320}
                autoplay
                autoplayDelay={3500}
                pauseOnHover
                loop
                round={false}
              />
            </div>
          </section>
        )}

        {/* Popular Clips */}
        {(data?.popularVideos?.length ?? 0) > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold text-white">Popular Clips</h2>
              <Link href="/videos" className="text-xs text-white/40 hover:text-white transition-colors">
                See all →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {data!.popularVideos!.map((video) => (
                <VideoCard key={video.id} video={video as any} />
              ))}
            </div>
          </section>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
