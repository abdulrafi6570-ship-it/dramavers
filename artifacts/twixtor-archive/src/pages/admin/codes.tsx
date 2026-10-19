import { useListAccessCodes, getListAccessCodesQueryKey, useCreateAccessCode, useDeleteAccessCode } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronLeft, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminCodes() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newCode, setNewCode] = useState("");
  const [expiredAt, setExpiredAt] = useState("");

  const { data: codes } = useListAccessCodes();
  const createCode = useCreateAccessCode();
  const deleteCode = useDeleteAccessCode();

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/login");
  }, [user, authLoading]);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAccessCodesQueryKey() });

  async function handleCreate() {
    if (!newCode.trim()) return;
    try {
      await createCode.mutateAsync({ data: { code: newCode, expiredAt: expiredAt || undefined } });
      setNewCode(""); setExpiredAt("");
      invalidate();
      toast({ title: "Access code created" });
    } catch (err: any) {
      toast({ title: "Gagal tambah kode", description: err?.message ?? "Server error", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    await deleteCode.mutateAsync({ id });
    invalidate();
    toast({ title: "Code deleted" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Access Codes
          </h1>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 mb-6">
          <h2 className="text-sm font-semibold text-white/70 mb-3">Add New Code</h2>
          <div className="flex gap-2">
            <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Code" className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-white/30 font-mono" />
            <Input type="date" value={expiredAt} onChange={(e) => setExpiredAt(e.target.value)} className="w-40 bg-black/40 border-white/10 text-white" />
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 neon-glow-purple" disabled={!newCode.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {codes?.map((code) => (
            <div key={code.id} className="glass-panel rounded-xl p-4 border border-white/10 flex items-center gap-3">
              <Key className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-mono text-white font-medium flex-1">{code.code}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded border ${code.active ? "bg-green-500/20 text-green-400 border-green-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"}`}>
                  {code.active ? "Active" : "Inactive"}
                </span>
                {code.expiredAt && <span className="text-white/40">Expires {new Date(code.expiredAt).toLocaleDateString()}</span>}
              </div>
              <button onClick={() => handleDelete(code.id)} className="text-white/30 hover:text-red-400 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {codes?.length === 0 && (
            <div className="text-center py-10 text-white/30">No access codes yet</div>
          )}
        </div>
      </main>
    </div>
  );
}
