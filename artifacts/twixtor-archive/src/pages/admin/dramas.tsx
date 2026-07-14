import { useListDramas, getListDramasQueryKey, useCreateDrama, useUpdateDrama, useDeleteDrama, useListActors, getListActorsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploader } from "@/components/FileUploader";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, ChevronLeft, Users, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DramaForm = { name: string; category: string; genre: string; description: string; posterUrl: string };
const emptyForm: DramaForm = { name: "", category: "kdrama", genre: "", description: "", posterUrl: "" };

interface Actor { id: number; name: string; photoUrl?: string | null }
interface Drama { id: number; name: string; category: string; posterUrl?: string | null }

export default function AdminDramas() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<DramaForm>(emptyForm);
  const [actorDialog, setActorDialog] = useState<Drama | null>(null);
  const [dramaActors, setDramaActors] = useState<Actor[]>([]);
  const [actorLoading, setActorLoading] = useState(false);
  const [selectedNewActor, setSelectedNewActor] = useState<string>("none");

  // Inline quick-create actor state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickType, setQuickType] = useState<"drama" | "solo">("drama");
  const [quickLoading, setQuickLoading] = useState(false);

  const { data } = useListDramas({ limit: 100 });
  const { data: allActors } = useListActors({ limit: 200 });
  const createDrama = useCreateDrama();
  const updateDrama = useUpdateDrama();
  const deleteDrama = useDeleteDrama();

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/login");
  }, [user, authLoading]);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListDramasQueryKey() });
  const invalidateActors = () => {
    qc.invalidateQueries({ queryKey: getListActorsQueryKey() });
    qc.invalidateQueries({ queryKey: getListActorsQueryKey({ limit: 200 }) });
  };

  async function handleSave() {
    const payload = {
      name: form.name, category: form.category as any,
      genre: form.genre || undefined, description: form.description || undefined,
      posterUrl: form.posterUrl || undefined,
    };
    try {
      if (editId) {
        await updateDrama.mutateAsync({ id: editId, data: payload });
        toast({ title: "Drama updated" });
        setShowForm(false); setForm(emptyForm); setEditId(null); invalidate();
      } else {
        const newDrama = await createDrama.mutateAsync({ data: payload }) as any;
        toast({ title: "Drama dibuat — tambahkan aktor sekarang!" });
        setShowForm(false); setForm(emptyForm); setEditId(null); invalidate();
        openActorDialog({ id: newDrama.id, name: newDrama.name, category: newDrama.category, posterUrl: newDrama.posterUrl ?? null });
      }
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this drama?")) return;
    await deleteDrama.mutateAsync({ id });
    toast({ title: "Deleted" }); invalidate();
  }

  const token = () => localStorage.getItem("twixtor_token");

  async function openActorDialog(drama: Drama) {
    setActorDialog(drama);
    setActorLoading(true);
    setSelectedNewActor("none");
    setShowQuickCreate(false);
    setQuickName("");
    try {
      const res = await fetch(`/api/dramas/${drama.id}/actors`, { headers: { Authorization: `Bearer ${token()}` } });
      setDramaActors(await res.json());
    } finally { setActorLoading(false); }
  }

  async function addActorToDrama(actorId: number) {
    if (!actorDialog) return;
    await fetch(`/api/dramas/${actorDialog.id}/actors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ actorId }),
    });
    const res = await fetch(`/api/dramas/${actorDialog.id}/actors`, { headers: { Authorization: `Bearer ${token()}` } });
    setDramaActors(await res.json());
    setSelectedNewActor("none");
    toast({ title: "Aktor ditambahkan" });
  }

  async function removeActorFromDrama(actorId: number) {
    if (!actorDialog) return;
    await fetch(`/api/dramas/${actorDialog.id}/actors/${actorId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    setDramaActors((prev) => prev.filter((a) => a.id !== actorId));
    toast({ title: "Aktor dihapus dari drama" });
  }

  async function createAndAddActor() {
    if (!quickName.trim() || !actorDialog) return;
    setQuickLoading(true);
    try {
      const res = await fetch("/api/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: quickName.trim(), type: quickType }),
      });
      if (!res.ok) throw new Error("Create failed");
      const newActor = await res.json();

      await fetch(`/api/dramas/${actorDialog.id}/actors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ actorId: newActor.id }),
      });

      const updated = await fetch(`/api/dramas/${actorDialog.id}/actors`, { headers: { Authorization: `Bearer ${token()}` } });
      setDramaActors(await updated.json());
      invalidateActors();
      setQuickName(""); setShowQuickCreate(false);
      toast({ title: `"${newActor.name}" berhasil dibuat & ditambahkan!` });
    } catch {
      toast({ title: "Gagal membuat aktor", variant: "destructive" });
    } finally { setQuickLoading(false); }
  }

  const assignedIds = new Set(dramaActors.map((a) => a.id));
  const availableActors = allActors?.actors.filter((a) => !assignedIds.has(a.id)) ?? [];
  const noActorsAtAll = allActors !== undefined && allActors.actors.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white flex-1">Drama Management</h1>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />Add
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.dramas.map((drama) => (
            <div key={drama.id} className="glass-panel rounded-xl p-4 border border-white/10 flex gap-3">
              {drama.posterUrl && <img src={drama.posterUrl} alt={drama.name} className="w-12 h-16 object-cover rounded flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white line-clamp-1">{drama.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{drama.category} · {drama.videoCount ?? 0} videos</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => openActorDialog({ id: drama.id, name: drama.name, category: drama.category, posterUrl: drama.posterUrl ?? null })} className="text-white/40 hover:text-blue-400 transition-colors" title="Kelola Aktor">
                  <Users className="h-4 w-4" />
                </button>
                <button onClick={() => { setForm({ name: drama.name, category: drama.category, genre: drama.genre ?? "", description: drama.description ?? "", posterUrl: drama.posterUrl ?? "" }); setEditId(drama.id); setShowForm(true); }} className="text-white/40 hover:text-primary transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(drama.id)} className="text-white/40 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add/Edit Drama Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass-panel border-white/10 text-white">
          <DialogHeader><DialogTitle className="text-white">{editId ? "Edit Drama" : "Add Drama"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name *" className="bg-black/40 border-white/10 text-white" />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-black/90 border-white/10 text-white">
                {["kdrama", "cdrama", "indo", "film_barat", "anime", "series"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} placeholder="Genre" className="bg-black/40 border-white/10 text-white" />
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">Poster Drama (dari galeri)</label>
              <FileUploader
                accept="image/*"
                label="Pilih Poster"
                currentUrl={form.posterUrl}
                previewType="image"
                thumbnailMode
                onUpload={(url) => setForm({ ...form, posterUrl: url })}
              />
            </div>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-black/40 border-white/10 text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90"><Check className="h-4 w-4 mr-2" />Save</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actor Management Dialog */}
      <Dialog open={!!actorDialog} onOpenChange={(open) => { if (!open) setActorDialog(null); }}>
        <DialogContent className="glass-panel border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aktor di "{actorDialog?.name}"
            </DialogTitle>
          </DialogHeader>

          {/* Inline quick-create actor */}
          {showQuickCreate ? (
            <div className="mt-2 space-y-2 bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-xs text-white/60 font-medium">Buat Aktor Baru</p>
              <Input
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Nama aktor / artis *"
                className="bg-black/40 border-white/10 text-white text-sm"
                onKeyDown={(e) => e.key === "Enter" && createAndAddActor()}
                autoFocus
              />
              <Select value={quickType} onValueChange={(v) => setQuickType(v as "drama" | "solo")}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  <SelectItem value="drama">Drama Actor</SelectItem>
                  <SelectItem value="solo">Solo Artist (KPop)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" onClick={createAndAddActor} disabled={!quickName.trim() || quickLoading} className="flex-1 bg-primary hover:bg-primary/90 text-xs">
                  <Check className="h-3 w-3 mr-1" />{quickLoading ? "Menyimpan..." : "Buat & Tambahkan"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowQuickCreate(false); setQuickName(""); }} className="border-white/20 text-white hover:bg-white/10 text-xs">
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-2">
              {noActorsAtAll ? (
                <Button
                  onClick={() => setShowQuickCreate(true)}
                  className="flex-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-sm"
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />Buat aktor baru
                </Button>
              ) : (
                <>
                  <Select value={selectedNewActor} onValueChange={setSelectedNewActor}>
                    <SelectTrigger className="flex-1 bg-black/40 border-white/10 text-white text-sm">
                      <SelectValue placeholder="Pilih aktor..." />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      <SelectItem value="none">— Pilih aktor —</SelectItem>
                      {availableActors.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={selectedNewActor === "none"}
                    onClick={() => selectedNewActor !== "none" && addActorToDrama(Number(selectedNewActor))}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowQuickCreate(true)}
                    className="border-white/20 text-white/60 hover:text-white hover:bg-white/10"
                    title="Buat aktor baru"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {noActorsAtAll && !showQuickCreate && (
            <p className="text-xs text-white/30 text-center -mt-1">
              Belum ada aktor di sistem. Klik tombol di atas untuk membuat aktor baru.
            </p>
          )}

          {/* Current actors */}
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {actorLoading ? (
              <div className="text-center py-4 text-white/40 text-sm">Loading...</div>
            ) : dramaActors.length === 0 ? (
              <div className="text-center py-4 text-white/20 text-sm">Belum ada aktor di drama ini</div>
            ) : (
              dramaActors.map((actor) => (
                <div key={actor.id} className="flex items-center gap-3 glass-panel rounded-lg px-3 py-2 border border-white/8">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-black/40 flex-shrink-0">
                    {actor.photoUrl
                      ? <img src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-bold">{actor.name.charAt(0)}</div>
                    }
                  </div>
                  <span className="flex-1 text-sm text-white">{actor.name}</span>
                  <button onClick={() => removeActorFromDrama(actor.id)} className="text-white/30 hover:text-red-400 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
