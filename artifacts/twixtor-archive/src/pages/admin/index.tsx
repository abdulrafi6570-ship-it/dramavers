import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Users, Film, Star, Download, Play, Shield, Megaphone, Settings2, Key, MessageCircle } from "lucide-react";
import AnimatedList from "@/components/AnimatedList";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey(), enabled: user?.role === "admin" }
  });

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/admin/login");
  }, [user, authLoading]);

  const statCards = [
    { label: "Users",     value: stats?.totalUsers,     icon: Users,    color: "#60a5fa" },
    { label: "Videos",   value: stats?.totalVideos,    icon: Film,     color: "#c084fc" },
    { label: "Dramas",   value: stats?.totalDramas,    icon: Star,     color: "#f472b6" },
    { label: "Actors",   value: stats?.totalActors,    icon: Play,     color: "#4ade80" },
    { label: "Downloads",value: stats?.totalDownloads, icon: Download, color: "#fb923c" },
  ];

  const mgmtItems = [
    { label: "Videos",       icon: <Film size={16} />,     action: () => setLocation("/admin/videos") },
    { label: "Dramas",       icon: <Star size={16} />,     action: () => setLocation("/admin/dramas") },
    { label: "Actors",       icon: <Users size={16} />,    action: () => setLocation("/admin/actors") },
    { label: "Users",        icon: <Shield size={16} />,   action: () => setLocation("/admin/users") },
    { label: "Access Codes", icon: <Key size={16} />,      action: () => setLocation("/admin/codes") },
    { label: "Iklan",        icon: <Megaphone size={16} />,    action: () => setLocation("/admin/ads") },
    { label: "Pesan User",   icon: <MessageCircle size={16} />,action: () => setLocation("/admin/feedback") },
    { label: "Settings",     icon: <Settings2 size={16} />,    action: () => setLocation("/admin/settings") },
  ];

  const listItems = mgmtItems.map(item => (
    <div className="flex items-center gap-3 w-full">
      <span className="text-white/40 flex-shrink-0">{item.icon}</span>
      <span className="text-sm font-semibold text-white/80">{item.label}</span>
      <span className="ml-auto text-white/20 text-xs">→</span>
    </div>
  ));

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-white/50" />
          </div>
          <div>
            <h1 className="font-miner text-base text-white leading-tight">Admin Panel</h1>
            <p className="text-[11px] text-white/30">Halo, {user?.username}</p>
          </div>
        </div>

        {/* Stats — 3 cols on mobile, 5 on desktop */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-3 border border-white/[0.06] bg-white/[0.03] flex flex-col gap-1.5"
            >
              <card.icon className="h-4 w-4 flex-shrink-0" style={{ color: card.color }} />
              <div>
                <p className="text-2xl font-black text-white leading-none">
                  {isLoading ? "—" : (card.value ?? 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Management — AnimatedList */}
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-2">
          Manajemen
        </p>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <AnimatedList
            items={listItems as any}
            onItemSelect={(_, index) => mgmtItems[index]?.action()}
            showGradients={false}
            enableArrowNavigation={true}
            displayScrollbar={false}
          />
        </div>

        {/* Top Downloads */}
        {stats?.popularVideos && stats.popularVideos.length > 0 && (
          <section className="mt-5">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-2">Top Downloads</p>
            <div className="flex flex-col gap-2">
              {stats.popularVideos.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setLocation(`/admin/videos`)}
                  className="rounded-xl p-3 border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] active:scale-[0.98] transition-all flex items-center gap-3 text-left w-full"
                >
                  <span className="text-sm font-black text-white/15 w-5 text-center flex-shrink-0">#{i + 1}</span>
                  <div className="w-9 h-9 rounded-lg bg-black/40 flex-shrink-0 border border-white/8 overflow-hidden">
                    {v.thumbnailUrl
                      ? <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-white/5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{v.title}</p>
                    <p className="text-[10px] text-white/30">{v.downloadCount?.toLocaleString()} downloads</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
