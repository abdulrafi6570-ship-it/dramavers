import Link from 'next/link';

export default function SharedDramaCard({ drama }) {
  if (!drama) return null;
  return (
    <Link href={`/drama/${drama.id}`} className="card p-2 flex gap-2 items-center max-w-xs mt-1">
      <div className="w-10 h-14 bg-muted rounded overflow-hidden shrink-0">
        {drama.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={drama.poster_url} alt={drama.title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{drama.title}</p>
        <p className="text-xs text-accent2">Lihat halaman →</p>
      </div>
    </Link>
  );
}
