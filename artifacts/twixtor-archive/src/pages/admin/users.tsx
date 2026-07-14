import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminUsers() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const { data } = useListUsers({ page, limit: 20 }, { query: { queryKey: getListUsersQueryKey({ page, limit: 20 }) } });

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/login");
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-left text-white/50 font-medium">Username</th>
                <th className="p-3 text-left text-white/50 font-medium">Role</th>
                <th className="p-3 text-left text-white/50 font-medium">Verified</th>
                <th className="p-3 text-left text-white/50 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="p-3 font-medium text-white">{u.username}</td>
                  <td className="p-3"><span className={`text-xs px-1.5 py-0.5 rounded border ${u.role === "admin" ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-white/50 border-white/10"}`}>{u.role}</span></td>
                  <td className="p-3"><span className={`text-xs ${u.verified ? "text-green-400" : "text-white/30"}`}>{u.verified ? "Yes" : "No"}</span></td>
                  <td className="p-3 text-white/40">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.total > 20 && (
            <div className="flex justify-center gap-2 p-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-white/20 text-white hover:bg-white/10">Prev</Button>
              <span className="text-white/50 text-sm self-center">Page {page} of {Math.ceil(data.total / 20)}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= data.total} className="border-white/20 text-white hover:bg-white/10">Next</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
