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

const CATEGORIES = [
  { key: "kdrama",     label: "K-Drama",    color: "#a855f7" },
  { key: "cdrama",     label: "C-Drama",    color: "#ec4899" },
  { key: "anime",      label: "Anime",      color: "#3b82f6" },
  { key: "indo",       label: "Indo",       color: "#22c55e" },
  { key: "series",     label: "Series",     color: "#f59e0b" },
  { key: "film_barat", label: "Film Barat", color: "#6366f1" },
];

export default function Home() {
  const { data, isLoading } = useGetHome();
  const [, setLocation] = useLocation();

  const posterUrls = (data?.featuredDramas ?? [])
    .map((d: any) => d.posterUrl)
    .filter(Boolean) as string[];

  const soloActorPhotos = ((data as any)?.featuredSoloActors ?? [])
    .map((a: any) => a.photoUrl)
    .filter(Boolean) as string[];

  const hasDomeGallery = posterUrls.length >= 3;
  const hasSoloGallery = soloActorPhotos.length >= 3;

  const videoItems = (data?.recentVideos ?? []).slice(0, 8).map((v: any) => ({
    id: v.id,
    title: v.title,
    description: v.dramaName ?? v.actorName ?? "Twixtor Clip",
    coverUrl: v.thumbnailUrl ?? null,
    icon: <Play size={14} />,
  }));

  const stats = data?.stats;
  const featuredDramas = data?.featuredDramas ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* ── Hero ── */}
        <div className="mb-6">
          {/* Animated hand-writing title */}
          <HandWrittenTitle title="TWIXTOR" subtitle="Archive" />

          {/* Stats + CardSwap row */}
          <div className="flex items-center justify-between gap-3 -mt-2">

            {/* Stats */}
            {stats && (
              <BorderGlow
                glowColor="270 60 70"
                backgroundColor="transparent"
                borderRadius={14}
                glowRadius={20}
                glowIntensity={0.9}
                edgeSensitivity={22}
                coneSpread={30}
                colors={['#c084fc', '#f472b6', '#38bdf8']}
                animated={true}
              >
                <div className="px-3 py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Film className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <Counter
                      value={stats.totalDramas}
                      places={[100, 10, 1]}
                      fontSize={15}
                      padding={2}
                      gap={1}
                      textColor="rgba(255,255,255,0.9)"
                      fontWeight={800}
                      gradientFrom="transparent"
                    />
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">Dramas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <Counter
                      value={stats.totalActors}
                      places={[100, 10, 1]}
                      fontSize={15}
                      padding={2}
                      gap={1}
                      textColor="rgba(255,255,255,0.9)"
                      fontWeight={800}
                      gradientFrom="transparent"
                    />
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">Aktor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <Counter
                      value={stats.totalVideos}
                      places={[100, 10, 1]}
                      fontSize={15}
                      padding={2}
                      gap={1}
                      textColor="rgba(255,255,255,0.9)"
                      fontWeight={800}
                      gradientFrom="transparent"
                    />
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">Clips</span>
                  </div>
                </div>
              </BorderGlow>
            )}

            {/* CardSwap poster stack */}
            {featuredDramas.length >= 2 && (
              <div className="flex-shrink-0" style={{ width: 112, height: 158, position: "relative" }}>
                <CardSwap
                  width={100}
                  height={140}
                  cardDistance={22}
                  verticalDistance={28}
                  delay={4000}
                  pauseOnHover
                  skewAmount={4}
                  easing="elastic"
                  onCardClick={(i) => {
                    const drama = featuredDramas[i];
                    if (drama) setLocation(`/dramas/${drama.id}`);
                  }}
                >
                  {featuredDramas.slice(0, 4).map((drama: any) => (
                    <Card key={drama.id}>
                      {drama.posterUrl ? (
                        <img
                          src={drama.posterUrl}
                          alt={drama.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px", gap: "6px" }}>
                          <Film style={{ width: 22, height: 22, color: "rgba(255,255,255,0.2)" }} />
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.3 }}>{drama.name}</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </CardSwap>
              </div>
            )}
          </div>
        </div>

        {/* ── Drama Gallery ── */}
        {hasDomeGallery && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-base font-semibold text-white">Drama Collection</h2>
              <Link href="/dramas" className="text-xs text-white/40 hover:text-white transition-colors">Lihat semua →</Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/8" style={{ height: "340px" }}>
              <DomeGallery
                images={posterUrls}
                maxVerticalRotationDeg={11}
                minRadius={500}
                overlayBlurColor="#080808"
                grayscale={false}
                imageBorderRadius="14px"
                openedImageBorderRadius="18px"
                openedImageWidth="220px"
                openedImageHeight="310px"
              />
            </div>
            <p className="text-center text-[10px] text-white/20 mt-1.5">Drag untuk menjelajahi</p>
          </section>
        )}

        {/* ── Solo Artists Gallery ── */}
        {hasSoloGallery && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-white/40" />
                <h2 className="font-heading text-base font-semibold text-white">Solo Artists</h2>
              </div>
              <Link href="/actors?tab=solo" className="text-xs text-white/40 hover:text-white transition-colors">Lihat semua →</Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/8" style={{ height: "300px" }}>
              <DomeGallery
                images={soloActorPhotos}
                maxVerticalRotationDeg={9}
                minRadius={450}
                overlayBlurColor="#080808"
                grayscale={false}
                imageBorderRadius="50%"
                openedImageBorderRadius="50%"
                openedImageWidth="200px"
                openedImageHeight="200px"
              />
            </div>
            <p className="text-center text-[10px] text-white/20 mt-1.5">Drag untuk menjelajahi</p>
          </section>
        )}

        {/* ── Browse by Category ── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-base font-semibold text-white">Browse by Category</h2>
            <Link href="/dramas" className="text-xs text-white/40 hover:text-white transition-colors">Lihat semua →</Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setLocation(`/dramas?category=${cat.key}`)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex items-center justify-center" style={{ height: 90 }}>
                  <Folder color={cat.color} size={0.95} />
                </div>
                <span className="font-bouncy text-[11px] text-white/60 group-hover:text-white transition-colors">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Recent Clips — Carousel ── */}
        {videoItems.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold text-white">Recent Clips</h2>
              <Link href="/videos" className="text-xs text-white/40 hover:text-white transition-colors">See all →</Link>
            </div>
            <div className="flex justify-start overflow-visible">
              <Carousel
                items={videoItems}
                baseWidth={Math.min(260, typeof window !== "undefined" ? window.innerWidth - 32 : 260)}
                autoplay
                autoplayDelay={3500}
                pauseOnHover
                loop
                round={false}
              />
            </div>
          </section>
        )}

        {/* ── Popular Clips grid ── */}
        {(data?.popularVideos?.length ?? 0) > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold text-white">Popular Clips</h2>
              <Link href="/videos" className="text-xs text-white/40 hover:text-white transition-colors">See all →</Link>
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
