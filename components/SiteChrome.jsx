'use client';

import { usePathname } from 'next/navigation';

import Navbar from './Navbar';
import BottomNav from './BottomNav';
import BackButton from './BackButton';

export default function SiteChrome({
  children,
  session,
  categories = [],
}) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith('/admin');

  // Lebar konten per halaman (semua otomatis di tengah, sejajar dengan tombol Kembali)
  const NARROW = ['/collections', '/leaderboard', '/requests', '/donate', '/watch-history'];
const MEDIUM = ['/search', '/profile'];
  const widthClass = NARROW.some((p) => pathname.startsWith(p))
    ? 'max-w-2xl'
    : MEDIUM.some((p) => pathname.startsWith(p))
    ? 'max-w-5xl'
    : 'max-w-6xl';

  if (isAdmin) {
    return children;
  }

  return (
    <>
      <Navbar session={session} categories={categories} />
      <main className={`container ${widthClass} py-4 sm:py-6 pb-safe`}>
        <BackButton />
        {children}
      </main>

      <BottomNav session={session} />
    </>
  );
}