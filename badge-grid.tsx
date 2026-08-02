import { Flame, Play, Heart, FolderHeart, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  label: string;
  icon: string;
  achieved: boolean;
}

const ICON_MAP: Record<string, typeof Flame> = {
  flame: Flame,
  play: Play,
  heart: Heart,
  folder: FolderHeart,
};

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="glass-panel rounded-2xl border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Pencapaian</h3>
      <div className="grid grid-cols-4 gap-3">
        {badges.map((b) => {
          const Icon = ICON_MAP[b.icon] ?? Flame;
          return (
            <div key={b.id} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={cn(
                  "h-14 w-14 rounded-full flex items-center justify-center transition-colors",
                  b.achieved ? "bg-primary/20 border border-primary/40" : "bg-white/5 border border-white/10"
                )}
              >
                {b.achieved ? (
                  <Icon className="h-6 w-6 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-white/20" />
                )}
              </div>
              <span className={cn("text-[10px] leading-tight", b.achieved ? "text-white/80" : "text-white/30")}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
