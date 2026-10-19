'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  Search,
  MessageCircle,
  Heart,
} from 'lucide-react';

import Button from './ui/button';
import Avatar from './ui/avatar';
import PillNav, { categoryIcon } from './ui/pill-nav';


export default function Navbar({ session, categories = [] }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const match = pathname.match(/^\/category\/([^/?#]+)/);
  const activeKey = match ? decodeURIComponent(match[1]) : null;

  const items = categories.map((c) => ({
    key: c.slug,
    label: c.name,
    href: `/category/${c.slug}`,
    Icon: categoryIcon(c.slug),
  }));

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur pt-safe">
      <div className="container max-w-6xl flex items-center gap-4 py-3">
<Link href="/" className="inline-flex items-center select-none group">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 680 165"
    className="h-9 sm:h-11 w-auto overflow-visible"
  >
    <defs>
      <style>{`
        @keyframes navClapSnap {
          0%, 70%, 100% { transform: rotate(0deg); }
          78% { transform: rotate(-16deg); }
          84% { transform: rotate(0deg); }
          88% { transform: rotate(-6deg); }
          92% { transform: rotate(0deg); }
        }
        @keyframes navPlayPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes navBadgeTilt {
          0%, 100% { transform: translate(418px, 40px) rotate(-4deg) scale(1); }
          50% { transform: translate(418px, 36px) rotate(3deg) scale(1.03); }
        }
        @keyframes navWaveDraw {
          0% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes navStarTwinkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.3) rotate(25deg); }
        }
        @keyframes navIconFloat {
          0%, 100% { transform: translate(12px, 18px); }
          50% { transform: translate(12px, 12px); }
        }
        .nav-anim-float { animation: navIconFloat 3.2s ease-in-out infinite; }
        .nav-anim-clap { transform-origin: 12px 42px; animation: navClapSnap 3.2s ease-in-out infinite; }
        .nav-anim-play { transform-origin: 62px 82px; animation: navPlayPulse 2s ease-in-out infinite; }
        .nav-anim-badge { animation: navBadgeTilt 2.8s ease-in-out infinite; }
        .nav-anim-wave { stroke-dasharray: 24 10; animation: navWaveDraw 3s linear infinite; }
        .nav-anim-star { transform-origin: 642px 28px; animation: navStarTwinkle 2.2s ease-in-out infinite; }
      `}</style>
    </defs>

    {/* Ikon Clapperboard Kiri */}
    <g className="nav-anim-float">
      <rect x="14" y="14" width="112" height="112" rx="28" fill="#111111" />
      <rect x="6" y="6" width="112" height="112" rx="28" fill="#FF2A85" stroke="#111111" strokeWidth="8" />
      <g className="nav-anim-clap">
        <path d="M6 34 C6 18 18 6 34 6 L90 6 C106 6 118 18 118 34 L118 42 L6 42 Z" fill="#FACC15" stroke="#111111" strokeWidth="8" />
        <line x1="38" y1="6" x2="26" y2="42" stroke="#111111" strokeWidth="7" />
        <line x1="72" y1="6" x2="60" y2="42" stroke="#111111" strokeWidth="7" />
        <line x1="104" y1="6" x2="92" y2="42" stroke="#111111" strokeWidth="7" />
      </g>
      <g className="nav-anim-play">
        <circle cx="66" cy="84" r="25" fill="#111111" />
        <circle cx="62" cy="80" r="25" fill="#FFFFFF" stroke="#111111" strokeWidth="6" />
        <polygon points="55,67 55,93 77,80" fill="#FF2A85" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
      </g>
    </g>

    {/* Teks DRAMA */}
    <text x="158" y="107" fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" fontSize="68" fontWeight="900" fill="currentColor" letterSpacing="-2">
      DRAMA
    </text>

    {/* Kapsul VERS */}
    <g className="nav-anim-badge">
      <rect x="7" y="7" width="214" height="76" rx="20" fill="#111111" />
      <rect x="0" y="0" width="214" height="76" rx="20" fill="#FF2A85" stroke="#111111" strokeWidth="6" />
      <text x="22" y="57" fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" fontSize="58" fontWeight="900" fill="#FFFFFF" letterSpacing="-1">
        VERS
      </text>
    </g>

    {/* Bintang Kuning */}
    <g className="nav-anim-star">
      <path d="M642 10 L647 23 L660 28 L647 33 L642 46 L637 33 L624 28 L637 23 Z" fill="#FACC15" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
    </g>

    {/* Garis Gelombang Pink */}
    <path d="M160 128 Q 220 116, 280 128 T 400 124" fill="none" stroke="#FF2A85" strokeWidth="7" strokeLinecap="round" className="nav-anim-wave" />
  </svg>
</Link>

        <div className="hidden md:block min-w-0 max-w-[50vw]">
  <PillNav
    items={items}
    activeKey={activeKey}
    layoutId="header-bubble"
    label="Kategori utama"
    variant="soft"
    wrapperClassName="p-0"
  />
</div>

        <div className="flex-1" />

        <Link
          href="/search"
          className="hidden sm:inline-flex"
        >
          <Button
            variant="ghost"
            size="icon"
            as="span"
          >
            <Search size={18} />
          </Button>
        </Link>

        <Link
          href="/chat"
          className="hidden sm:inline-flex"
        >
          <Button
            variant="ghost"
            size="icon"
            as="span"
          >
            <MessageCircle size={18} />
          </Button>
        </Link>

        <Link
          href="/donate"
          className="hidden sm:inline-flex"
        >
          <Button
            variant="ghost"
            size="icon"
            as="span"
          >
            <Heart size={18} />
          </Button>
        </Link>

        {session ? (
          <>
            {session.role === 'admin' && (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center rounded-xl border border-[#171717] bg-[#f59e0b] px-3 text-xs font-black text-black transition hover:bg-[#fbbf24]"
              >
                Admin
              </Link>
            )}

            <Link
              href={`/profile/${session.username}`}
              className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <Avatar
                size={28}
                alt={session.username}
                src={session.avatar_url}
              />

              <span className="hidden lg:inline">
                @{session.username}
              </span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground transition"
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link href="/login">
            <Button
              size="sm"
              as="span"
            >
              Masuk
            </Button>
          </Link>
        )}

      </div>
    </header>
  );
}