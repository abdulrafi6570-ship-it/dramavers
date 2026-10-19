import { Flame, Play, Heart, FolderHeart, Lock, MessageCircle, ListPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from './ui/card';

const ICONS = { flame: Flame, play: Play, heart: Heart, folder: FolderHeart, comment: MessageCircle, request: ListPlus };

export function computeBadges(stats) {
  return [
    { id: 'streak3', label: 'Streak 3 Hari', icon: 'flame', achieved: stats.streak >= 3 },
    { id: 'streak7', label: 'Streak 7 Hari', icon: 'flame', achieved: stats.streak >= 7 },
    { id: 'watch10', label: 'Nonton 10 Klip', icon: 'play', achieved: stats.views >= 10 },
    { id: 'watch50', label: 'Nonton 50 Klip', icon: 'play', achieved: stats.views >= 50 },
    { id: 'like10', label: 'Suka 10 Klip', icon: 'heart', achieved: stats.likes >= 10 },
    { id: 'collector', label: 'Punya Koleksi', icon: 'folder', achieved: stats.collections >= 1 },
    { id: 'commenter', label: 'Komentar Pertama', icon: 'comment', achieved: stats.comments >= 1 },
    { id: 'requester', label: 'Request Pertama', icon: 'request', achieved: stats.requests >= 1 },
  ];
}

export default function BadgeGrid({ badges }) {
  return (
    <Card className="p-5">
      <h3 className="font-bold mb-4">Pencapaian</h3>
      <div className="grid grid-cols-4 gap-3">
        {badges.map((b) => {
          const Icon = ICONS[b.icon] || Flame;
          return (
            <div key={b.id} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={cn(
                  'h-14 w-14 rounded-full flex items-center justify-center border transition',
                  b.achieved ? 'bg-primary/15 border-primary/40' : 'bg-secondary/40 border-border'
                )}
              >
                {b.achieved ? <Icon size={22} className="text-primary" /> : <Lock size={18} className="text-muted-foreground/50" />}
              </div>
              <span className={cn('text-[10px] leading-tight', b.achieved ? 'text-foreground' : 'text-muted-foreground/50')}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
