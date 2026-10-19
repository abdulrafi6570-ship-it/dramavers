import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API_BASE = "https://quart-shallow-frog.abasthan.app";

interface AnalyticsData {
  viewsPerDay: { date: string; count: number }[];
  viewsByHour: { hour: number; count: number }[];
  topVideos: { id: number; title: string; viewCount: number; thumbnailUrl: string | null }[];
  topDramas: { id: number; name: string; posterUrl: string | null; favoriteCount: number }[];
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/admin/analytics`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat analytics");
  return res.json();
}

export default function AdminAnalytics() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAnalytics,
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/admin/login");
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
            <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            <section className="glass-panel rounded-2xl border-white/10 p-4 md:p-6">
              <h2 className="text-white font-semibold mb-4">Penonton — 30 Hari Terakhir</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.viewsPerDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                    <Line type="monotone" dataKey="count" name="Views" stroke="#a855f7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="glass-panel rounded-2xl border-white/10 p-4 md:p-6">
              <h2 className="text-white font-semibold mb-4">Jam Rame (Semua Waktu)</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.viewsByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickFormatter={(h) => `${h}:00`} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} labelStyle={{ color: "#fff" }} labelFormatter={(h) => `Jam ${h}:00`} />
                    <Bar dataKey="count" name="Views" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
              <div className="glass-panel rounded-2xl border-white/10 p-4 md:p-6">
                <h2 className="text-white font-semibold mb-4">Video Paling Laris</h2>
                <div className="space-y-2">
                  {data.topVideos.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-sm font-black text-white/20 w-5 text-center flex-shrink-0">#{i + 1}</span>
                      <div className="w-9 h-9 rounded-lg bg-black/40 flex-shrink-0 overflow-hidden">
                        {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{v.title}</p>
                        <p className="text-[10px] text-white/40">{v.viewCount.toLocaleString()} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-2xl border-white/10 p-4 md:p-6">
                <h2 className="text-white font-semibold mb-4">Drama Paling Difavoritkan</h2>
                <div className="space-y-2">
                  {data.topDramas.map((d, i) => (
                    <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-sm font-black text-white/20 w-5 text-center flex-shrink-0">#{i + 1}</span>
                      <div className="w-9 h-9 rounded-lg bg-black/40 flex-shrink-0 overflow-hidden">
                        {d.posterUrl && <img src={d.posterUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{d.name}</p>
                        <p className="text-[10px] text-white/40">{d.favoriteCount.toLocaleString()} favorit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
