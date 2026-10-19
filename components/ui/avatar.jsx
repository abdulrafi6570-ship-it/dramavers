import { cn } from '../../lib/utils';

export default function Avatar({ src, alt, fallback, className, size = 40 }) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground',
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || ''} className="h-full w-full object-cover" />
      ) : (
        <span>{(fallback || alt || '?').slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}
