import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, Loader2, FolderHeart } from "lucide-react";

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

async function addVideoToCollection(collectionId: number, videoId: number): Promise<void> {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/collections/${collectionId}/videos/${videoId}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal menambahkan video");
}

export function AddToCollectionDialog({
  videoId,
  open,
  onOpenChange,
}: {
  videoId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    enabled: open,
  });

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);

  const handleAdd = async (collectionId: number) => {
    setAddingId(collectionId);
    try {
      await addVideoToCollection(collectionId, videoId);
      setAddedIds((prev) => new Set(prev).add(collectionId));
    } finally {
      setAddingId(null);
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const created = await createCollection(trimmed);
      setNewName("");
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      await handleAdd(created.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FolderHeart className="h-5 w-5" />
            Simpan ke Koleksi
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama koleksi baru..."
            className="bg-black/40 border-white/10 text-white"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="bg-primary text-black hover:bg-primary/90 flex-shrink-0">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {isLoading ? (
            <p className="text-white/40 text-sm text-center py-4">Memuat...</p>
          ) : collections && collections.length > 0 ? (
            collections.map((c) => {
              const added = addedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleAdd(c.id)}
                  disabled={addingId === c.id}
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-black/40 flex-shrink-0">
                      {c.coverUrl && <img src={c.coverUrl} className="w-full h-full object-cover" alt={c.name} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{c.name}</p>
                      <p className="text-xs text-white/40">{c.videoCount} video</p>
                    </div>
                  </div>
                  {addingId === c.id ? (
                    <Loader2 className="h-4 w-4 text-white/40 animate-spin flex-shrink-0" />
                  ) : added ? (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-white/40 flex-shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <p className="text-white/40 text-sm text-center py-4">Belum ada koleksi. Buat baru di atas.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
