import { useListActors, getListActorsQueryKey, useCreateActor, useUpdateActor, useDeleteActor } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploader } from "@/components/FileUploader";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ActorType = "drama" | "solo";
type ActorForm = { name: string; photoUrl: string; type: ActorType; bio: string };
const emptyForm: ActorForm = { name: "", photoUrl: "", type: "drama", bio: "" };

export default function AdminActors() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ActorForm>(emptyForm);
  const [tab, setTab] = useState<ActorType>("drama");

  const { data: dramaData } = useListActors({ type: "drama", limit: 200 });
  const { data: soloData } = useListActors({ type: "solo", limit: 200 });
  const createActor = useCreateActor();
  const updateActor = useUpdateActor();
  const deleteActor = useDeleteActor();

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/login");
  }, [user, authLoading]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListActorsQueryKey() });
    qc.invalidateQueries({ queryKey: getListActorsQueryKey({ type: "drama" }) });
    qc.invalidateQueries({ queryKey: getListActorsQueryKey({ type: "solo" }) });
  };

  async function handleSave() {
    const payload = {
      name: form.name,
      photoUrl: form.photoUrl || undefined,
      type: form.type,
      bio: form.bio || undefined,
    };
    try {
      if (editId) {
        await updateActor.mutateAsync({ id: editId, data: payload });
        toast({ title: "Actor updated" });
      } else {
        await createActor.mutateAsync({ data: payload });
        toast({ title: "Actor created" });
      }
      setShowForm(false); setForm(emptyForm); setEditId(null); invalidate();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this actor?")) return;
    await deleteActor.mutateAsync({ id });
    toast({ title: "Deleted" }); invalidate();
  }

  const actors = tab === "drama" ? dramaData?.actors : soloData?.actors;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white flex-1">Actor Management</h1>
          <Button onClick={() => { setForm({ ...emptyForm, type: tab }); setEditId(null); setShowForm(true); }} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />Add {tab === "drama" ? "Actor" : "Artist"}
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("drama")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
              tab === "drama"
                ? "bg-primary/20 border-primary/60 text-primary"
                : "border-white/10 text-white/40 hover:text-white"
            }`}
          >
            Drama Actors ({dramaData?.actors.length ?? 0})
          </button>
          <button
            onClick={() => setTab("solo")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
              tab === "solo"
                ? "bg-primary/20 border-primary/60 text-primary"
                : "border-white/10 text-white/40 hover:text-white"
            }`}
          >
            Solo Artists ({soloData?.actors.length ?? 0})
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {actors?.map((actor) => (
            <div key={actor.id} className="glass-panel rounded-xl p-4 border border-white/10 text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 bg-white/5">
                {actor.photoUrl
                  ? <img src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-xl">{actor.name.charAt(0)}</div>
                }
              </div>
              <p className="text-sm font-medium text-white line-clamp-1">{actor.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{actor.videoCount ?? 0} clips</p>
              <div className="flex justify-center gap-3 mt-3">
                <button
                  onClick={() => {
                    setForm({ name: actor.name, photoUrl: actor.photoUrl ?? "", type: (actor.type ?? "drama") as ActorType, bio: "" });
                    setEditId(actor.id); setShowForm(true);
                  }}
                  className="text-white/40 hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(actor.id)} className="text-white/40 hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass-panel border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{editId ? "Edit" : "Add"} {form.type === "drama" ? "Actor" : "Solo Artist"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ActorType })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  <SelectItem value="drama">Drama Actor</SelectItem>
                  <SelectItem value="solo">Solo Artist (KPop/Solo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name *"
              className="bg-black/40 border-white/10 text-white"
            />
            <Input
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Bio (optional)"
              className="bg-black/40 border-white/10 text-white"
            />
            <div className="space-y-1.5">
              <label className="text-xs text-white/50">Photo</label>
              <FileUploader
                accept="image/*"
                label="Upload Photo"
                currentUrl={form.photoUrl}
                previewType="image"
                onUpload={(url) => setForm({ ...form, photoUrl: url })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90" disabled={createActor.isPending || updateActor.isPending}>
              <Check className="h-4 w-4 mr-2" />Save
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
