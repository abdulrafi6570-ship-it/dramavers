'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Play, Clock, Flame, Film, ArrowDownAZ, Eye } from 'lucide-react';
import { Card } from './ui/card';
import Badge from './ui/badge';

const FILTER_TABS = [
  { id: 'latest', label: 'Terbaru', icon: Clock },
  { id: 'popular', label: 'Terpopuler', icon: Flame },
  { id: 'most_clips', label: 'Klip Terbanyak', icon: Film },
  { id: 'az', label: 'A - Z', icon: ArrowDownAZ },
];

export default function DramaGridFilter({ dramas = [] }) {
  const [activeTab, setActiveTab] = useState('latest');

  const sortedDramas = useMemo(() => {
    const list = [...dramas];
    if (activeTab === 'popular') {
      return list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    }
    if (activeTab === 'most_clips') {
      return list.sort((a, b) => (b.clips_count || 0) - (a.clips_count || 0));
    }
    if (activeTab === 'az') {
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    // Default: Terbaru
    return list;
  }, [dramas, activeTab]);

  return (
    <div className="space-y-4">
      {/* Header & Deretan Tombol Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Koleksi Klip</h2>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-border px-3 py-1.5 text-xs font-extrabold transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-neo-sm -translate-y-0.5'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Daftar Kartu */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {sortedDramas.map((d) => (
          <Link key={d.id} href={`/drama/${d.id}`} className="group">
            <Card className="overflow-hidden h-full flex flex-col">
              <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                {d.poster_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.poster_url}
                    alt={d.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Play size={28} />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

                {/* Info Jumlah Klip & Tayangan di Atas Poster */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white">
                  {d.clips_count > 0 && (
                    <span className="rounded-md bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                      {d.clips_count} Klip
                    </span>
                  )}
                  {d.views_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                      <Eye size={10} />
                      {d.views_count}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {d.title}
                </p>
                {d.category_name && (
                  <Badge variant="secondary" className="mt-1.5 w-fit">
                    {d.category_name}
                  </Badge>
                )}
              </div>
            </Card>
          </Link>
        ))}

        {sortedDramas.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-full">
            Belum ada konten. Login sebagai admin untuk mulai upload.
          </p>
        )}
      </div>
    </div>
  );
}