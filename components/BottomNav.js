'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Clapperboard, Search, Users, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav({ session }) {
  const pathname = usePathname() || '/';

  const items = [
    { href: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
    {
      href: '/category',
      label: 'Video',
      icon: Clapperboard,
      match: (p) => p.startsWith('/category') || p.startsWith('/drama'),
    },
    { href: '/search', label: 'Cari', icon: Search, match: (p) => p.startsWith('/search') },
    { href: '/chat', label: 'Komunitas', icon: Users, match: (p) => p.startsWith('/chat') },
    {
      href: session ? `/profile/${session.username}` : '/login',
      label: 'Profil',
      icon: User,
      match: (p) => p.startsWith('/profile') || p.startsWith('/login'),
    },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <motion.nav
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        role="navigation"
        aria-label="Navigasi bawah"
        className="pointer-events-auto flex h-[52px] max-w-[95vw] items-center gap-1 rounded-full border border-border bg-card/95 p-2 shadow-xl backdrop-blur"
      >
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);

          return (
            <motion.div key={label} whileTap={{ scale: 0.96 }}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-10 min-w-[44px] items-center justify-center rounded-full px-3 py-2 transition-colors duration-200 focus:outline-none',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={22} strokeWidth={2} aria-hidden className="shrink-0" />

                {/* Label hanya muncul di tab yang aktif */}
                <motion.span
                  initial={false}
                  animate={{
                    width: active ? 'auto' : 0,
                    opacity: active ? 1 : 0,
                    marginLeft: active ? 8 : 0,
                  }}
                  transition={{
                    width: { type: 'spring', stiffness: 350, damping: 32 },
                    opacity: { duration: 0.19 },
                    marginLeft: { duration: 0.19 },
                  }}
                  className="flex items-center overflow-hidden whitespace-nowrap select-none text-xs font-semibold leading-none"
                >
                  {label}
                </motion.span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    </div>
  );
}