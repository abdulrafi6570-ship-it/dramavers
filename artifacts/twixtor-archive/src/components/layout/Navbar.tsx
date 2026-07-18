import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, LayoutDashboard, Home, Film, Users, Heart, MessageSquare } from "lucide-react";
import Dock from "@/components/Dock";
import BubbleMenu from "@/components/BubbleMenu";
import Lottie from "lottie-react";
import searchAnim from "@assets/lottieflow-search-02-000000-easey_1781367392237.json";
import { useState } from "react";
import { DonationModal } from "@/components/DonationModal";

function SearchIcon({ active }: { active: boolean }) {
  return (
    <Lottie
      animationData={searchAnim}
      loop={active}
      autoplay={active}
      style={{ width: 22, height: 22, filter: "invert(1)", opacity: active ? 1 : 0.6 }}
    />
  );
}

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [donationOpen, setDonationOpen] = useState(false);

  const navLinks = [
    { href: "/",       label: "Home"   },
    { href: "/dramas", label: "Dramas" },
    { href: "/actors", label: "Actors" },
    { href: "/videos", label: "Browse" },
    { href: "/messages",   label: "Chat"   },
    { href: "/search", label: "Search" },
  ];

  const isSearchActive = location.startsWith("/search");

  const dockItems = [
    {
      icon: <Home size={18} />,
      label: "Home",
      active: location === "/",
      onClick: () => setLocation("/"),
    },
    {
      icon: <Film size={18} />,
      label: "Browse",
      active: location.startsWith("/videos"),
      onClick: () => setLocation("/videos"),
    },
    {
      icon: <SearchIcon active={isSearchActive} />,
      label: "Cari",
      active: isSearchActive,
      onClick: () => setLocation("/search"),
    },
    {
      icon: <MessageSquare size={18} />,
      label: "Chat",
      active: location.startsWith("/messages"),
      onClick: () => setLocation("/messages"),
    },
    {
      icon: user?.photoUrl ? (
        <img src={(user as any).photoUrl} alt={user.username} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <User size={18} />
      ),
      label: user ? "Profil" : "Masuk",
      active: location.startsWith("/profile") || location.startsWith("/login"),
      onClick: () => setLocation(user ? "/profile" : "/login"),
    },
  ];

  const bubbleItems = [
    {
      label: "Home",
      onClick: () => setLocation("/"),
      hoverStyles: { bgColor: "rgba(255,255,255,0.1)", textColor: "#fff" },
    },
    {
      label: "Browse",
      onClick: () => setLocation("/videos"),
      hoverStyles: { bgColor: "rgba(192,132,252,0.2)", textColor: "#c084fc" },
    },
    {
      label: "Dramas",
      onClick: () => setLocation("/dramas"),
      hoverStyles: { bgColor: "rgba(244,114,182,0.2)", textColor: "#f472b6" },
    },
    {
      label: "Actors",
      onClick: () => setLocation("/actors"),
      hoverStyles: { bgColor: "rgba(56,189,248,0.2)", textColor: "#38bdf8" },
    },
    {
      label: "Chat",
      onClick: () => setLocation("/messages"),
      hoverStyles: { bgColor: "rgba(74,222,128,0.2)", textColor: "#4ade80" },
    },
    {
      label: "Search",
      onClick: () => setLocation("/search"),
      hoverStyles: { bgColor: "rgba(74,222,128,0.2)", textColor: "#4ade80" },
    },
    {
      label: "❤️ Support",
      onClick: () => setDonationOpen(true),
      hoverStyles: { bgColor: "rgba(236,72,153,0.2)", textColor: "#f472b6" },
    },
    ...(user
      ? [
          {
            label: user.role === "admin" ? "Admin" : "Profile",
            onClick: () => setLocation(user.role === "admin" ? "/admin" : "/profile"),
            hoverStyles: { bgColor: "rgba(251,146,60,0.2)", textColor: "#fb923c" },
          },
        ]
      : [
          {
            label: "Sign in",
            onClick: () => setLocation("/login"),
            hoverStyles: { bgColor: "rgba(255,255,255,0.12)", textColor: "#fff" },
          },
        ]),
  ];

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-13 items-center px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="flex flex-col leading-none">
              <span className="font-brand text-[15px] tracking-[0.12em] text-white group-hover:text-white/90 transition-colors">
                TWIXTOR
              </span>
              <span className="font-accent text-[9px] tracking-[0.35em] text-white/30 -mt-0.5">Archive</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex ml-8 gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === "/" ? location === "/" : location.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? "text-white bg-white/8"
                      : "text-white/45 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white/70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side — desktop auth */}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setDonationOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:border-pink-400/50 hover:text-pink-300"
            >
              <Heart className="h-3 w-3 fill-pink-400" />
              Support
            </button>
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/6"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/6"
                >
                  {(user as any).photoUrl ? (
                    <img src={(user as any).photoUrl} alt={user.username} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[9px] font-bold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {user.username}
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/6"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-medium text-white/45 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:block text-sm font-bold bg-white hover:bg-white/90 text-black px-4 py-1.5 rounded-lg transition-colors"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile: BubbleMenu hamburger (top-right, fixed) */}
      <div className="md:hidden">
        <BubbleMenu
          hideLogo={true}
          useFixedPosition={true}
          menuBg="rgba(12,12,18,0.88)"
          menuContentColor="rgba(255,255,255,0.85)"
          menuAriaLabel="Open navigation"
          items={bubbleItems}
          animationEase="back.out(1.4)"
          animationDuration={0.38}
          staggerDelay={0.09}
        />
      </div>

      {/* Mobile Bottom Dock */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-[400] flex justify-center items-end"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <Dock
          items={dockItems}
          panelHeight={60}
          baseItemSize={44}
          magnification={58}
          distance={120}
        />
      </div>

      {/* Donation Modal */}
      <DonationModal open={donationOpen} onClose={() => setDonationOpen(false)} />
    </>
  );
}
