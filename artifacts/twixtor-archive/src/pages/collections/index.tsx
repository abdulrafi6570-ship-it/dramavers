import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderHeart, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_BASE = "https://quart-shallow-frog.abasthan.app";

interface CollectionSummary {
  id: number;
  name: string;
  videoCount: number;
  coverUrl: string | null;
}

async function fetchCollections(): Promise<CollectionSummary[]> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/collections`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Gagal memuat koleksi");
  return res.json();
}

async function createCollection(name: string): Promise<CollectionSummary> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/collections`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Gagal membuat koleksi");
  return res.json();
}

export default function Collections() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    enabled: !!user,
  });

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await createCollection(trimmed);
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <FolderHeart className="h-7 w-7 text-primary" />
          Koleksi Saya
        </h1>

        <div className="flex gap-2 mb-8 max-w-md">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama koleksi baru..."
            className="bg-black/40 border-white/10 text-white"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="bg-primary text-black hover:bg-primary/90 flex-shrink-0">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
            Buat
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : collections && collections.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className="group relative aspect-[9/16] overflow-hidden rounded-xl glass-panel block border-white/5 hover:border-primary/50 transition-all"
              >
                {c.coverUrl ? (
                  <img src={c.coverUrl} alt={c.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                    <FolderHeart className="h-10 w-10 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-medium text-sm text-white line-clamp-2 leading-tight">{c.name}</h3>
                  <p className="text-[10px] text-white/50 mt-1">{c.videoCount} video</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            <FolderHeart className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Belum ada koleksi</p>
            <p className="text-sm mt-1">Buat koleksi pertama kamu di atas</p>
          </div>
        )}
      </main>
    </div>
  );
}
