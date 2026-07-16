import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { FileUploader } from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings2, Music, Save, ToggleLeft, ToggleRight, Heart, QrCode, Wallet, KeyRound, Eye, EyeOff } from "lucide-react";

export default function AdminSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [bgmUrl, setBgmUrl] = useState("");
  const [bgmEnabled, setBgmEnabled] = useState(false);

  const [danaNumber, setDanaNumber] = useState("");
  const [danaName, setDanaName] = useState("");
  const [gopayNumber, setGopayNumber] = useState("");
  const [gopayName, setGopayName] = useState("");
  const [saweriaUrl, setSaweriaUrl] = useState("");
  const [donationQrUrl, setDonationQrUrl] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user && user.role !== "admin") setLocation("/");
    if (user === null) setLocation("/admin/login");
  }, [user, authLoading]);

  const token = () => localStorage.getItem("twixtor_token");

  useEffect(() => {
    const load = async () => {
      try {
        const keys = ["bgm_url", "bgm_enabled", "dana_number", "dana_name", "gopay_number", "gopay_name", "saweria_url", "donation_qr_url"];
        const results = await Promise.all(keys.map((k) => fetch(`/api/settings/${k}`).then((r) => r.json())));
        if (results[0]?.value) setBgmUrl(results[0].value);
        if (results[1]?.value) setBgmEnabled(results[1].value === "true");
        if (results[2]?.value) setDanaNumber(results[2].value);
        if (results[3]?.value) setDanaName(results[3].value);
        if (results[4]?.value) setGopayNumber(results[4].value);
        if (results[5]?.value) setGopayName(results[5].value);
        if (results[6]?.value) setSaweriaUrl(results[6].value);
        if (results[7]?.value) setDonationQrUrl(results[7].value);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    await fetch(`/api/admin/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ value }),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("bgm_url", bgmUrl),
        saveSetting("bgm_enabled", String(bgmEnabled)),
        saveSetting("dana_number", danaNumber),
        saveSetting("dana_name", danaName),
        saveSetting("gopay_number", gopayNumber),
        saveSetting("gopay_name", gopayName),
        saveSetting("saweria_url", saweriaUrl),
        saveSetting("donation_qr_url", donationQrUrl),
      ]);
      toast({ title: "Pengaturan disimpan!" });
      window.dispatchEvent(new Event("settings-updated"));
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeCredentials = async () => {
    if (!newUsername.trim() && !newPassword.trim()) {
      toast({ title: "Isi username baru atau password baru", variant: "destructive" });
      return;
    }
    setSavingCreds(true);
    try {
      const res = await fetch("/api/auth/change-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          ...(newUsername.trim() ? { newUsername: newUsername.trim() } : {}),
          ...(newPassword.trim() ? { newPassword: newPassword.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Kredensial berhasil diubah! Silakan login ulang." });
        setNewUsername("");
        setNewPassword("");
        setTimeout(() => { localStorage.removeItem("twixtor_token"); setLocation("/admin/login"); }, 1800);
      } else {
        toast({ title: data.error ?? "Gagal mengubah", variant: "destructive" });
      }
    } finally {
      setSavingCreds(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Settings2 className="h-6 w-6 text-white/60" />
          <h1 className="text-2xl font-bold text-white">Pengaturan Web</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── Admin Credentials ── */}
            <div className="glass-panel rounded-2xl p-6 border border-white/8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Ubah Kredensial Admin</h2>
                  <p className="text-xs text-white/40">Ganti username atau password login admin</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Username Baru (opsional)</label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={`Saat ini: ${user?.username ?? "admin"}`}
                    className="bg-white/5 border-white/10 text-white h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Password Baru (opsional)</label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="bg-white/5 border-white/10 text-white h-10 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleChangeCredentials}
                  disabled={savingCreds || (!newUsername.trim() && !newPassword.trim())}
                  className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10 h-10 text-sm"
                >
                  {savingCreds ? "Menyimpan..." : "Simpan Kredensial"}
                </Button>
                <p className="text-[11px] text-white/25">Setelah menyimpan, kamu akan otomatis logout dan harus login ulang.</p>
              </div>
            </div>

            {/* ── BGM Section ── */}
            <div className="glass-panel rounded-2xl p-6 border border-white/8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center">
                  <Music className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Backsound Web</h2>
                  <p className="text-xs text-white/40">Musik latar yang muncul di semua halaman</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/8">
                  <div>
                    <p className="text-sm text-white/80">Aktifkan Backsound</p>
                    <p className="text-xs text-white/35">Musik akan otomatis play saat web dibuka</p>
                  </div>
                  <button onClick={() => setBgmEnabled(!bgmEnabled)} className="flex-shrink-0">
                    {bgmEnabled ? (
                      <ToggleRight className="h-8 w-8 text-white" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-white/30" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/50">Upload File Audio (MP3/WAV/dll)</label>
                  <FileUploader
                    accept="audio/*"
                    label="Upload Audio"
                    currentUrl={bgmUrl}
                    previewType="audio"
                    onUpload={(url) => setBgmUrl(url)}
                  />
                  <p className="text-xs text-white/30">— atau konversi dari video —</p>
                  <FileUploader
                    accept="video/*,audio/*"
                    label="Upload Video → MP3"
                    currentUrl=""
                    previewType="audio"
                    toMp3
                    onUpload={(url) => setBgmUrl(url)}
                  />
                  {bgmUrl && <p className="text-[10px] text-white/25 break-all">{bgmUrl}</p>}
                </div>

                {bgmUrl && (
                  <div className="glass-panel rounded-xl p-3 border border-white/8">
                    <p className="text-xs text-white/40 mb-2">Preview audio:</p>
                    <audio src={bgmUrl} controls className="w-full" />
                  </div>
                )}
              </div>
            </div>

            {/* ── Donation Settings ── */}
            <div className="glass-panel rounded-2xl p-6 border border-white/8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Pengaturan Donasi</h2>
                  <p className="text-xs text-white/40">Nomor payment dan link untuk modal Support Us</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <span className="text-base">💙</span> Nomor DANA
                  </label>
                  <Input
                    value={danaNumber}
                    onChange={(e) => setDanaNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm font-mono"
                  />
                  <Input
                    value={danaName}
                    onChange={(e) => setDanaName(e.target.value)}
                    placeholder="Atas nama (a/n)"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm mt-1.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <span className="text-base">💚</span> Nomor GoPay
                  </label>
                  <Input
                    value={gopayNumber}
                    onChange={(e) => setGopayNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm font-mono"
                  />
                  <Input
                    value={gopayName}
                    onChange={(e) => setGopayName(e.target.value)}
                    placeholder="Atas nama (a/n)"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm mt-1.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> Link Saweria
                  </label>
                  <Input
                    value={saweriaUrl}
                    onChange={(e) => setSaweriaUrl(e.target.value)}
                    placeholder="https://saweria.co/username"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" /> Foto QR QRIS (dari galeri)
                  </label>
                  <FileUploader
                    accept="image/*"
                    label="Upload Foto QR"
                    currentUrl={donationQrUrl}
                    previewType="image"
                    onUpload={(url) => setDonationQrUrl(url)}
                  />
                  {donationQrUrl && (
                    <div className="flex items-center gap-3 mt-2">
                      <img
                        src={donationQrUrl}
                        alt="QR Preview"
                        className="w-24 h-24 object-contain rounded-xl border border-white/10 bg-white p-1"
                      />
                      <div>
                        <p className="text-xs text-white/50">Preview QR saat ini</p>
                        <p className="text-[10px] text-white/25 break-all mt-1">{donationQrUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-white hover:bg-white/90 text-black font-semibold h-11"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
