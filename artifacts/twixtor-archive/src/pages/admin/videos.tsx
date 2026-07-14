import {
  useListVideos, getListVideosQueryKey, useCreateVideo, useUpdateVideo,
  useDeleteVideo, useBulkUpdateVideos, useListDramas, useListActors
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploader } from "@/components/FileUploader";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, ChevronLeft, Film, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusColors: Record<string, string> = {
  published: "bg-green-500/20 text-green-400 border-green-500/40",
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  hidden: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  broken: "bg-red-500/20 text-red-400 border-red-500/40",
};

type UploadMode = "drama" | "solo";

type VideoForm = {
  title: string;
  dramaId?: number;
  actorId?: number;
  episode?: string;
  scene?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  type: "slomo" | "non_slomo";
  status: string;
  resolution?: string;
  fps?: number;
  tags: string;
};

const emptyForm: VideoForm = { title: "", type: "slomo", status: "draft", tags: "" };

export default function AdminVideos() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<VideoForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [uploadMode, setUploadMode] = useState<UploadMode>("drama");

  const { data } = useListVideos(
    { search: search || undefined, status: status === "all" ? undefined : status, page, limit: 20 },
    { query: { queryKey: getListVideosQueryKey({ search: search || undefined, status: status === "all" ? undefined : status, page, limit: 20 }) } }
  );
  const { data: dramas } = useListDramas({ limit: 100 });
  // For drama mode: only load actors from the selected drama
  const { data: dramaActors } = useListActors(
    { dramaId: form.dramaId, limit: 100 },
    { query: { enabled: uploadMode === "drama" && !!form.dramaId } }
  );
  // For solo mode: only load solo-type actors
  const { data: soloActors } = useListActors(
    { type: "solo", limit: 100 },
    { query: { enabled: uploadMode === "solo" } }
  );

  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();
  const bulkUpdate = useBulkUpdateVideos();

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/login");
  }, [user, authLoading]);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListVideosQueryKey() });

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  }

  function buildPayload() {
    return {
      title: form.title,
      type: form.type as any,
      status: form.status as any,
      dramaId: uploadMode === "drama" ? form.dramaId : undefined,
      actorId: form.actorId,
      episode: form.episode || undefined,
      scene: form.scene || undefined,
      videoUrl: form.videoUrl || undefined,
      thumbnailUrl: form.thumbnailUrl || undefined,
      resolution: form.resolution || undefined,
      fps: form.fps || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
    };
  }

  async function handleSave() {
    try {
      if (editId) {
        await updateVideo.mutateAsync({ id: editId, data: buildPayload() });
        toast({ title: "Video updated" });
      } else {
        await createVideo.mutateAsync({ data: buildPayload() });
        toast({ title: "Video created" });
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      invalidate();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  async function handleSaveAndAddAnother() {
    try {
      await createVideo.mutateAsync({ data: buildPayload() });
      toast({ title: "Tersimpan! Tambah video lagi." });
      invalidate();
      // Keep drama/actor selection, clear video-specific fields
      setForm((prev) => ({
        ...emptyForm,
        dramaId: prev.dramaId,
        actorId: prev.actorId,
        type: prev.type,
        status: prev.status,
        episode: prev.episode,
      }));
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this video?")) return;
    await deleteVideo.mutateAsync({ id });
    toast({ title: "Deleted" });
    invalidate();
  }

  async function handleBulk(action: "publish" | "unpublish" | "delete") {
    if (selected.size === 0) return;
    await bulkUpdate.mutateAsync({ data: { videoIds: Array.from(selected), action } });
    setSelected(new Set());
    invalidate();
    toast({ title: `${action} applied to ${selected.size} videos` });
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const actorOptions = uploadMode === "drama" ? dramaActors?.actors : soloActors?.actors;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-white flex-1">Video Management</h1>
          <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-white/30 max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36 bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 text-white">
              {["all", "published", "draft", "hidden", "processing", "broken"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulk("publish")} className="border-green-500/40 text-green-400 hover:bg-green-500/10">Publish ({selected.size})</Button>
              <Button variant="outline" size="sm" onClick={() => handleBulk("unpublish")} className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">Unpublish</Button>
              <Button variant="outline" size="sm" onClick={() => handleBulk("delete")} className="border-red-500/40 text-red-400 hover:bg-red-500/10">Delete</Button>
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-left w-8">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(data?.videos.map((v) => v.id) ?? []));
                      else setSelected(new Set());
                    }}
                    className="accent-primary"
                  />
                </th>
                <th className="p-3 text-left text-white/50 font-medium">Title</th>
                <th className="p-3 text-left text-white/50 font-medium hidden md:table-cell">Drama / Actor</th>
                <th className="p-3 text-left text-white/50 font-medium">Type</th>
                <th className="p-3 text-left text-white/50 font-medium">Status</th>
                <th className="p-3 text-left text-white/50 font-medium hidden md:table-cell">DL</th>
                <th className="p-3 text-right text-white/50 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.videos.map((video) => (
                <tr key={video.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(video.id)} onChange={() => toggleSelect(video.id)} className="accent-primary" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="w-8 h-12 object-cover rounded" />}
                      <span className="text-white font-medium line-clamp-1 max-w-[200px]">{video.title}</span>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {video.dramaName && <span className="text-white/50 text-xs">{video.dramaName}</span>}
                      {video.actorName && <span className="text-white/30 text-xs">{video.actorName}</span>}
                      {!video.dramaName && !video.actorName && <span className="text-white/20 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${video.type === "slomo" ? "bg-primary/20 text-primary border-primary/40" : "bg-blue-500/20 text-blue-400 border-blue-500/40"}`}>
                      {video.type === "slomo" ? "SLOMO" : "NORMAL"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${statusColors[video.status] ?? ""}`}>
                      {video.status}
                    </span>
                  </td>
                  <td className="p-3 text-white/50 hidden md:table-cell">{video.downloadCount}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          const isDrama = !!video.dramaId;
                          setUploadMode(isDrama ? "drama" : "solo");
                          setForm({
                            title: video.title,
                            type: video.type as any,
                            status: video.status,
                            dramaId: video.dramaId ?? undefined,
                            actorId: video.actorId ?? undefined,
                            episode: video.episode ?? "",
                            scene: video.scene ?? "",
                            videoUrl: video.videoUrl ?? "",
                            thumbnailUrl: video.thumbnailUrl ?? "",
                            resolution: video.resolution ?? "",
                            fps: video.fps ?? undefined,
                            tags: (video.tags ?? []).join(", "),
                          });
                          setEditId(video.id);
                          setShowForm(true);
                        }}
                        className="text-white/40 hover:text-primary transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(video.id)} className="text-white/40 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.total > 20 && (
            <div className="flex justify-center gap-2 p-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-white/20 text-white hover:bg-white/10">Prev</Button>
              <span className="text-white/50 text-sm self-center">Page {page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= data.total} className="border-white/20 text-white hover:bg-white/10">Next</Button>
            </div>
          )}
        </div>
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="glass-panel border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editId ? "Edit Video" : "Add Video"}</DialogTitle>
          </DialogHeader>

          {/* Upload mode switcher */}
          {!editId && (
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => { setUploadMode("drama"); setForm((f) => ({ ...f, dramaId: undefined, actorId: undefined })); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  uploadMode === "drama"
                    ? "bg-primary/20 border-primary/60 text-primary"
                    : "border-white/10 text-white/40 hover:text-white"
                }`}
              >
                <Film className="h-4 w-4" />
                Drama Clip
              </button>
              <button
                onClick={() => { setUploadMode("solo"); setForm((f) => ({ ...f, dramaId: undefined, episode: "" })); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  uploadMode === "solo"
                    ? "bg-primary/20 border-primary/60 text-primary"
                    : "border-white/10 text-white/40 hover:text-white"
                }`}
              >
                <Star className="h-4 w-4" />
                Solo Artist Clip
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-black/40 border-white/10 text-white" />
            </div>

            {/* Drama mode: pick drama then actor from drama's cast */}
            {uploadMode === "drama" && (
              <>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Drama *</label>
                  <Select
                    value={form.dramaId?.toString() ?? "none"}
                    onValueChange={(v) => setForm({ ...form, dramaId: v !== "none" ? Number(v) : undefined, actorId: undefined })}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue placeholder="Select drama" /></SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      <SelectItem value="none">— None —</SelectItem>
                      {dramas?.dramas.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">
                    Aktor {form.dramaId ? "(dari cast drama ini)" : "(pilih drama dulu)"}
                  </label>
                  <Select
                    value={form.actorId?.toString() ?? "none"}
                    onValueChange={(v) => setForm({ ...form, actorId: v !== "none" ? Number(v) : undefined })}
                    disabled={!form.dramaId}
                  >
                    <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue placeholder="Pilih aktor" /></SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/10 text-white">
                      <SelectItem value="none">— None —</SelectItem>
                      {actorOptions?.map((a) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.dramaId && dramaActors && actorOptions?.length === 0 && (
                    <p className="text-[11px] text-yellow-400/80 mt-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1.5">
                      Drama ini belum punya aktor. Tambahkan dulu di <strong>Drama Management</strong> (ikon 👥 di kartu drama).
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Episode</label>
                  <Input value={form.episode ?? ""} onChange={(e) => setForm({ ...form, episode: e.target.value })} className="bg-black/40 border-white/10 text-white" placeholder="e.g. EP01" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Scene</label>
                  <Input value={form.scene ?? ""} onChange={(e) => setForm({ ...form, scene: e.target.value })} className="bg-black/40 border-white/10 text-white" />
                </div>
              </>
            )}

            {/* Solo mode: pick solo artist directly */}
            {uploadMode === "solo" && (
              <div className="col-span-2">
                <label className="text-xs text-white/50 mb-1 block">Solo Artist *</label>
                <Select
                  value={form.actorId?.toString() ?? "none"}
                  onValueChange={(v) => setForm({ ...form, actorId: v !== "none" ? Number(v) : undefined })}
                >
                  <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue placeholder="Select solo artist" /></SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 text-white">
                    <SelectItem value="none">— None —</SelectItem>
                    {actorOptions?.map((a) => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs text-white/50 mb-1 block">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  <SelectItem value="slomo">Slomo</SelectItem>
                  <SelectItem value="non_slomo">Non Slomo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  {["draft", "published", "hidden"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Upload Video</label>
              <FileUploader accept="video/*" label="Pilih Video" currentUrl={form.videoUrl ?? ""} previewType="video" onUpload={(url) => setForm({ ...form, videoUrl: url })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Upload Thumbnail</label>
              <FileUploader accept="image/*,video/*" label="Pilih Thumbnail" currentUrl={form.thumbnailUrl ?? ""} previewType="image" thumbnailMode onUpload={(url) => setForm({ ...form, thumbnailUrl: url })} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Resolution</label>
              <Input value={form.resolution ?? ""} onChange={(e) => setForm({ ...form, resolution: e.target.value })} className="bg-black/40 border-white/10 text-white" placeholder="e.g. 1080p" />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">FPS</label>
              <Input type="number" value={form.fps ?? ""} onChange={(e) => setForm({ ...form, fps: e.target.value ? Number(e.target.value) : undefined })} className="bg-black/40 border-white/10 text-white" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/50 mb-1 block">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-black/40 border-white/10 text-white" placeholder="twixtor, slowmo, kiss" />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90" disabled={createVideo.isPending || updateVideo.isPending}>
                <Check className="h-4 w-4 mr-2" />{editId ? "Update" : "Simpan"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }} className="border-white/20 text-white hover:bg-white/10">Batal</Button>
            </div>
            {!editId && (
              <Button
                variant="outline"
                onClick={handleSaveAndAddAnother}
                disabled={createVideo.isPending}
                className="w-full border-primary/30 text-primary hover:bg-primary/10 text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />Simpan & Tambah Video Lagi
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
