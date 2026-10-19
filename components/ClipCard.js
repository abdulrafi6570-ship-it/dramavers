import Link from 'next/link';
import { Film } from 'lucide-react';
import { Card } from './ui/card';
import VideoPlayer from './VideoPlayer';
import ClipActions from './ClipActions';
import ExpandableText from './ExpandableText';

export default function ClipCard({ clip, drama }) {
  const sourceDrama = drama || clip.dramas;

  return (
    <Card className="overflow-hidden flex flex-col">
      <VideoPlayer
        src={clip.video_url}
        poster={clip.thumbnail_url}
        clipId={clip.id}
      />
      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Baris Judul Klip & Badge Kapsul Sumber Drama */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-sm truncate">
              {clip.title || `Klip #${clip.episode_number || ''}`}
            </h3>

            {sourceDrama && (
              <Link
                href={`/drama/${sourceDrama.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-border bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground shadow-neo-sm transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground active:translate-y-0 active:shadow-none"
              >
                <Film size={12} className="shrink-0" />
                <span className="max-w-[110px] truncate">{sourceDrama.title}</span>
              </Link>
            )}
          </div>

          {clip.description && <ExpandableText text={clip.description} />}
        </div>

        <ClipActions clip={clip} />
      </div>
    </Card>
  );
}