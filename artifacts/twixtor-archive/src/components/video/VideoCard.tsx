import { Video } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";
import likeAnim from "@assets/lottieflow-ecommerce-14-14-000000-easey_1781367392935.json";
import pinAnim from "@assets/lottieflow-ecommerce-14-15-000000-easey_1781367393012.json";
import { GlareHover } from "@/components/ui/glare-hover";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <GlareHover
      color="#a855f7"
      opacity={0.18}
      angle={-40}
      size={220}
      duration={700}
      playOnce
      background="transparent"
      className="w-full rounded-xl"
      width="100%"
    >
    <Link href={`/videos/${video.id}`} className="group relative aspect-[9/16] overflow-hidden rounded-xl glass-panel block border-white/5 hover:border-primary/50 transition-all hover:neon-glow-purple duration-300 w-full">
      {video.thumbnailUrl ? (
        <img src={video.thumbnailUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Like button — Lottie finger-up icon */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/80 flex items-center justify-center"
        >
          <Lottie
            animationData={likeAnim}
            loop={false}
            autoplay={video.isFavorited}
            style={{
              width: 20,
              height: 20,
              filter: video.isFavorited ? "invert(1) sepia(1) saturate(10) hue-rotate(300deg)" : "invert(1)",
            }}
          />
        </Button>

        {/* Bookmark button — Lottie pin icon */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/80 flex items-center justify-center"
        >
          <Lottie
            animationData={pinAnim}
            loop={false}
            autoplay={video.isBookmarked}
            style={{
              width: 20,
              height: 20,
              filter: video.isBookmarked ? "invert(1) sepia(1) saturate(10) hue-rotate(300deg)" : "invert(1)",
            }}
          />
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex gap-1 mb-1.5">
          <span className={`font-miner text-[9px] px-1.5 py-0.5 rounded ${video.type === 'slomo' ? 'bg-white text-black' : 'bg-white/10 text-white/55 border border-white/10'}`}>
            {video.type === 'slomo' ? 'SLOMO' : 'NORMAL'}
          </span>
        </div>
        <h3 className="font-medium text-sm text-white line-clamp-2 leading-tight">{video.title}</h3>
        <div className="flex justify-between items-end mt-1.5">
          <p className="text-xs text-white/55 line-clamp-1">{video.dramaName || video.actorName}</p>
          <span className="text-[10px] text-white/35">{video.viewCount} views</span>
        </div>
      </div>
    </Link>
    </GlareHover>
  );
}
