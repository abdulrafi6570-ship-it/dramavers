import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { FileUploader } from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Eye, EyeOff, ArrowLeft, Megaphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Ad {
  id: number;
  type: "image" | "video";
  mediaUrl: string;
  title?: string;
  description?: string;
  durationSeconds?: number;
  linkUrl?: string;
  active: boolean;
  sortOrder: number;
}

function emptyAd(): Omit<Ad, "id"> {
  return { type: "image", mediaUrl: "", title: "", description: "", durationSeconds: 5, linkUrl: "", active: true, sortOrder: 0 };
}

export default function AdminAds() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [form, setForm] = useState(emptyAd());

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/admin/login");
  }, [user, authLoading]);

  const token = () => localStorage.getItem("twixtor_token");

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setAds(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyAd()); setDialogOpen(true); };
  const openEdit = (ad: Ad) => { setEditing(ad); setForm({ ...ad }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.mediaUrl) { toast({ title: "Upload media dulu", variant: "destructive" }); return; }
    try {
      const url = editing ? `/api/admin/ads/${editing.id}` : "/api/admin/ads";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ title: editing ? "Iklan diperbarui" : "Iklan ditambahkan" });
      setDialogOpen(false);
      fetchAds();
    } catch {
      toast({ title: "Gagal menyimpan iklan", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus iklan ini?")) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    toast({ title: "Iklan dihapus" });
    fetchAds();
  };

  const toggleActive = async (ad: Ad) => {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ active: !ad.active }),
    });
    fetchAds();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-white/40 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <Megaphone className="h-6 w-6 text-white/60" />
          <h1 className="text-2xl font-bold text-white">Manajemen Iklan</h1>
          <Button onClick={openCreate} size="sm" className="ml-auto bg-white hover:bg-white/90 text-black font-medium">
            <Plus className="h-4 w-4 mr-1.5" /> Tambah Iklan
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Belum ada iklan. Tambah iklan pertama!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {ads.map((ad) => (
              <div key={ad.id} className="glass-panel rounded-xl p-4 border border-white/8 flex items-center gap-4">
                {/* Preview */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 border border-white/8">
                  {ad.type === "video" ? (
                    <video src={ad.mediaUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={ad.mediaUrl} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ad.type === "video" ? "bg-blue-500/20 text-blue-300" : "bg-white/15 text-white/60"}`}>
                      {ad.type.toUpperCase()}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${ad.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {ad.active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">{ad.title || "Tanpa judul"}</p>
                  <p className="text-xs text-white/35">{ad.type === "image" ? `${ad.durationSeconds ?? 5} detik` : "Durasi video"}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(ad)} className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-all">
                    {ad.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(ad)} className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-all">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="p-2 rounded-lg hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-panel-strong border border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{editing ? "Edit Iklan" : "Tambah Iklan Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50">Tipe Iklan</label>
                <div className="flex gap-2">
                  {(["image", "video"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${form.type === t ? "bg-white text-black border-white" : "border-white/15 text-white/50 hover:border-white/30"}`}
                    >
                      {t === "image" ? "🖼 Foto" : "🎬 Video"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50">Upload Media</label>
                <FileUploader
                  accept={form.type === "video" ? "video/*" : "image/*"}
                  label={form.type === "video" ? "Upload Video" : "Upload Foto"}
                  currentUrl={form.mediaUrl}
                  previewType={form.type}
                  onUpload={(url) => setForm({ ...form, mediaUrl: url })}
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50">Judul (opsional)</label>
                <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-10 text-sm" placeholder="Judul iklan besar" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50">Deskripsi (opsional)</label>
                <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={2} placeholder="Deskripsi singkat" />
              </div>

              {/* Duration (image only) */}
              {form.type === "image" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Durasi Tampil (detik)</label>
                  <Input type="number" min={1} max={300} value={form.durationSeconds ?? 5}
                    onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white h-10 text-sm" />
                </div>
              )}

              {/* Link */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/50">Link saat diklik (opsional)</label>
                <Input value={form.linkUrl ?? ""} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-10 text-sm" placeholder="https://..." />
              </div>

              {/* Active */}
              <div className="flex items-center justify-between glass-panel rounded-lg px-4 py-3 border border-white/8">
                <span className="text-sm text-white/70">Aktifkan iklan</span>
                <button onClick={() => setForm({ ...form, active: !form.active })}
                  className={`w-11 h-6 rounded-full transition-all relative ${form.active ? "bg-white" : "bg-white/15"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${form.active ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-white/15 text-white/60">Batal</Button>
                <Button onClick={handleSave} className="flex-1 bg-white hover:bg-white/90 text-black font-semibold">
                  {editing ? "Simpan Perubahan" : "Tambah Iklan"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
