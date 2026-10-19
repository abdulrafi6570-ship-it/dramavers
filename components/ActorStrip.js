import Link from 'next/link';
import { User } from 'lucide-react';

export default function ActorStrip({ actors = [] }) {
  if (!actors || actors.length === 0) return null;

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none">
      {actors.map((actor) => {
        const initial = actor.name ? actor.name.charAt(0).toUpperCase() : '?';

        return (
          <Link
            key={actor.id}
            href={`/actor/${actor.id}`}
            className="group flex w-20 shrink-0 flex-col items-center text-center"
          >
            {/* Bingkai Foto Lingkaran */}
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-[3px] border-border bg-muted shadow-neo-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary group-active:translate-y-0 group-active:shadow-none">
              {actor.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={actor.photo_url}
                  alt={actor.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary text-lg font-bold text-secondary-foreground">
                  {initial || <User size={24} />}
                </div>
              )}
            </div>

            {/* Nama & Bio Singkat di Bawah Lingkaran */}
            <p className="mt-2 w-full truncate text-xs font-bold group-hover:text-primary transition-colors">
              {actor.name}
            </p>
            {actor.bio && (
              <p className="w-full truncate text-[10px] text-muted-foreground">
                {actor.bio}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}