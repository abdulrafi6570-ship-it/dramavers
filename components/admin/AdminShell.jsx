'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Tags,
  Users,
  Film,
  Clapperboard,
  Inbox,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

const menu = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/categories',
    label: 'Kategori',
    icon: Tags,
  },
  {
    href: '/admin/actors',
    label: 'Kelola Aktor',
    icon: Users,
  },
  {
    href: '/admin/dramas',
    label: 'Kelola Drama',
    icon: Film,
  },
  {
    href: '/admin/clips',
    label: 'Kelola Klip',
    icon: Clapperboard,
  },
  {
    href: '/admin/inbox',
    label: 'Pesan User',
    icon: Inbox,
  },
  {
    href: '/admin/feedback',
    label: 'Feedback',
    icon: MessageSquare,
  },
  {
    href: '/admin/analytics',
    label: 'Analitik',
    icon: BarChart3,
  },
  {
    href: '/admin/settings',
    label: 'Pengaturan',
    icon: Settings,
  },
];

export default function AdminShell({ children, session }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    router.push('/login');
    router.refresh();
  }

  return (
    <div className="admin-shell min-h-screen bg-[#f5f5f2] text-[#171717]">

      {/* ================= DESKTOP SIDEBAR ================= */}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[250px] flex-col border-r border-[#deded8] bg-white lg:flex">

        <div className="flex h-[76px] items-center border-b border-[#ecece7] px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f59e0b] text-xs font-black text-black">
              DV
            </div>

            <div>
              <p className="text-[15px] font-black tracking-tight">
                DramaVers
              </p>

              <p className="text-[11px] font-medium text-[#8a8a83]">
                Admin Panel
              </p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0a09a]">
            Menu utama
          </p>

          <nav className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'group flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition',
                    active
                      ? 'bg-[#fff4dc] text-[#b45309]'
                      : 'text-[#666660] hover:bg-[#f5f5f2] hover:text-[#171717]',
                  ].join(' ')}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                  />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="my-5 h-px bg-[#ecece7]" />

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0a09a]">
            Aksi cepat
          </p>

          <Link
            href="/admin/clips/new"
            className="flex min-h-[44px] items-center gap-3 rounded-xl bg-[#171717] px-3 text-sm font-bold text-white transition hover:bg-[#292929]"
          >
            <Plus size={18} />
            Upload Klip
          </Link>
        </div>

        <div className="border-t border-[#ecece7] p-3">

          <div className="mb-2 flex items-center gap-3 rounded-xl bg-[#f7f7f5] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] text-xs font-bold text-white">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {session?.username || 'Admin'}
              </p>

              <p className="text-[11px] text-[#888881]">
                Administrator
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#deded8] bg-white text-xs font-semibold text-[#666660] hover:bg-[#f5f5f2]"
            >
              <ExternalLink size={14} />
              Website
            </Link>

            <button
              onClick={logout}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#deded8] bg-white text-xs font-semibold text-[#666660] hover:bg-[#fff1f1] hover:text-red-600"
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MOBILE HEADER ================= */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#deded8] bg-white/95 px-4 backdrop-blur lg:hidden">

        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b] text-[11px] font-black text-black">
            DV
          </div>

          <div>
            <p className="text-sm font-black">
              DramaVers
            </p>

            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#999991]">
              Admin
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#deded8] bg-white"
          aria-label="Menu admin"
        >
          {mobileOpen ? (
            <X size={19} />
          ) : (
            <Menu size={19} />
          )}
        </button>
      </header>

      {/* ================= MOBILE MENU ================= */}

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden">
          <div className="absolute left-0 right-0 top-16 border-b border-[#deded8] bg-white px-4 pb-4 pt-3 shadow-xl">

            <nav className="grid grid-cols-2 gap-2">
              {menu.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      'flex min-h-[48px] items-center gap-2 rounded-xl px-3 text-sm font-semibold',
                      active
                        ? 'bg-[#fff4dc] text-[#b45309]'
                        : 'bg-[#f7f7f5] text-[#666660]',
                    ].join(' ')}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 grid grid-cols-2 gap-2">

              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#deded8] text-sm font-semibold"
              >
                <ExternalLink size={15} />
                Website
              </Link>

              <button
                type="button"
                onClick={logout}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#deded8] text-sm font-semibold text-red-600"
              >
                <LogOut size={15} />
                Keluar
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ================= CONTENT ================= */}

      <main className="lg:ml-[250px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:px-8 lg:py-8 lg:pb-10">
          {children}
        </div>
      </main>

      {/* ================= MOBILE BOTTOM NAV ================= */}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#deded8] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">

        <div className="mx-auto flex max-w-lg items-center justify-around py-2">

          {[
            {
              href: '/admin',
              label: 'Home',
              icon: LayoutDashboard,
              exact: true,
            },
            {
              href: '/admin/clips',
              label: 'Klip',
              icon: Clapperboard,
            },
            {
              href: '/admin/inbox',
              label: 'Pesan',
              icon: Inbox,
            },
            {
              href: '/admin/analytics',
              label: 'Data',
              icon: BarChart3,
            },
          ].map((item) => {
            const Icon = item.icon;

            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold',
                  active
                    ? 'bg-[#fff4dc] text-[#b45309]'
                    : 'text-[#8a8a83]',
                ].join(' ')}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}

        </div>
      </nav>

    </div>
  );
}