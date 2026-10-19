'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Globe,
  Clapperboard,
  Mic2,
  Music,
  Sparkles,
  Folder,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Ikon per slug kategori. Kategori baru buatan admin otomatis pakai Folder.
export const CATEGORY_ICONS = {
  all: LayoutGrid,
  asia: Globe,
  western: Clapperboard,
  jkt48: Mic2,
  kpop: Music,
  anime: Sparkles,
};

export function categoryIcon(slug) {
  return CATEGORY_ICONS[slug] || Folder;
}

// Dua gaya supaya navbar header & navbar kategori tidak kembar:
// - bold : border tebal + shadow neobrutalism + bubble pink + ikon (navbar kategori)
// - soft : ringan, tanpa border, bubble gelap, tanpa ikon (header)
const VARIANTS = {
  bold: {
    nav: 'border-[3px] border-border bg-card p-1 shadow-neo-sm',
    link: 'h-9 px-3.5',
    bubble: 'border-2 border-border bg-primary',
    active: 'text-primary-foreground',
    idle: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    icons: true,
  },
  soft: {
    nav: 'bg-muted p-1',
    link: 'h-8 px-3.5',
    bubble: 'bg-foreground shadow-sm',
    active: 'text-background',
    idle: 'text-muted-foreground hover:text-foreground',
    icons: false,
  },
};

// items: [{ key, href, label, Icon }]
// layoutId harus UNIK per navbar di halaman yang sama
export default function PillNav({
  items,
  activeKey = null,
  layoutId,
  label = 'Navigasi',
  variant = 'bold',
  className,
  wrapperClassName,
}) {
  const v = VARIANTS[variant] || VARIANTS.bold;
  const boxRef = useRef(null);
  const activeRef = useRef(null);

  // Geser otomatis supaya tab aktif ada di tengah (kalau daftar panjang)
  useEffect(() => {
    const box = boxRef.current;
    const el = activeRef.current;
    if (!box || !el) return;
    if (box.scrollWidth <= box.clientWidth) return;
    const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    box.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [activeKey]);

  return (
    <div
      ref={boxRef}
      className={cn('relative overflow-x-auto pb-1 pr-1 scrollbar-none', wrapperClassName)}
    >
      <nav
        aria-label={label}
        className={cn('flex w-max items-center gap-1 rounded-full', v.nav, className)}
      >
        {items.map(({ key, href, label: text, Icon }) => {
          const active = key === activeKey;

          return (
            <Link
              key={key}
              href={href}
              ref={active ? activeRef : null}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex shrink-0 items-center gap-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors duration-200 focus:outline-none',
                v.link,
                active ? v.active : v.idle
              )}
            >
              {/* Bubble: elemen yang sama berpindah antar tab */}
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className={cn('absolute inset-0 rounded-full', v.bubble)}
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}

              {v.icons && Icon && (
                <Icon
                  size={17}
                  strokeWidth={2.25}
                  aria-hidden
                  className="relative z-10 shrink-0"
                />
              )}
              <span className="relative z-10 whitespace-nowrap">{text}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}