'use client';

import { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Save,
} from 'lucide-react';

export default function AdminRedeemSettings() {
  const [codes, setCodes] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);

  // State untuk Pengumuman Berjalan & Link TikTok
  const [runningText, setRunningText] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
      if (data.announcement) {
        setRunningText(data.announcement.running_text || '');
        setTiktokUrl(data.announcement.tiktok_url || '');
        setIsActive(Boolean(data.announcement.is_active));
      }
    } catch (err) {
      console.error('Gagal memuat pengaturan');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'announcement',
          running_text: runningText,
          tiktok_url: tiktokUrl,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        setMessage(data.error || 'Gagal menyimpan pengumuman.');
      } else {
        setIsError(false);
        setMessage('Pengumuman berjalan & Link TikTok berhasil disimpan!');
      }
    } catch {
      setIsError(true);
      setMessage('Terjadi kesalahan koneksi.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddCode = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        setMessage(data.error || 'Gagal menambah kode.');
        setLoading(false);
        return;
      }

      setNewCode('');
      setIsError(false);
      setMessage('Kode TikTok berhasil ditambahkan!');
      fetchSettings();
    } catch {
      setIsError(true);
      setMessage('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCode = async (id) => {
    if (!confirm('Yakin ingin menghapus kode ini?')) return;
    try {
      await fetch(`/api/admin/settings?id=${id}`, { method: 'DELETE' });
      fetchSettings();
    } catch {
      console.error('Gagal menghapus');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl border-2 border-border p-3 text-xs font-bold ${
            isError ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'
          }`}
        >
          {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{message}</span>
        </div>
      )}

      {/* BAGIAN 1: PENGUMUMAN BERJALAN & LINK TIKTOK */}
      <form
        onSubmit={handleSaveAnnouncement}
        className="rounded-3xl border-[3px] border-border bg-card p-5 shadow-neo space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-primary" />
            <h2 className="text-lg font-extrabold">Banner Pengumuman & Link TikTok</h2>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Tampilkan di Beranda</span>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1">
              Teks Berjalan (Running Text)
            </label>
            <input
              type="text"
              value={runningText}
              onChange={(e) => setRunningText(e.target.value)}
              placeholder="Contoh: 🔥 Kode download terbaru ada di VT TikTok @akun_kamu!"
              className="w-full rounded-xl border-[3px] border-border bg-background px-3.5 py-2 text-sm font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Link Profil / Video TikTok Kamu
            </label>
            <input
              type="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@username_kamu"
              className="w-full rounded-xl border-[3px] border-border bg-background px-3.5 py-2 text-sm font-bold focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingConfig}
          className="inline-flex items-center gap-2 rounded-xl border-[3px] border-border bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
        >
          <Save size={15} />
          <span>{savingConfig ? 'Menyimpan...' : 'Simpan Pengumuman'}</span>
        </button>
      </form>

      {/* BAGIAN 2: KELOLA KODE REDEEM TIKTOK */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold">Kelola Kode Redeem TikTok</h2>
          <p className="text-xs text-muted-foreground">
            Pengguna cukup memasukkan salah satu kode aktif di bawah ini sekali saja untuk membuka download.
          </p>
        </div>

        <form
          onSubmit={handleAddCode}
          className="flex gap-2 rounded-2xl border-[3px] border-border bg-card p-4 shadow-neo-sm"
        >
          <div className="relative flex-1">
            <KeyRound
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Contoh: TIKTOK123"
              className="w-full rounded-xl border-[3px] border-border bg-background py-2 pl-10 pr-4 text-sm font-bold focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newCode.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl border-[3px] border-border bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-neo-sm disabled:opacity-60"
          >
            <Plus size={16} />
            <span>{loading ? 'Menyimpan...' : 'Tambah Kode'}</span>
          </button>
        </form>

        <div className="rounded-3xl border-[3px] border-border bg-card p-5 shadow-neo space-y-3">
          <h3 className="font-bold text-sm">Daftar Kode Aktif ({codes.length})</h3>
          {codes.length > 0 ? (
            <div className="divide-y divide-border">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="font-mono font-bold text-sm bg-muted px-2.5 py-1 rounded-lg border border-border">
                    {c.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCode(c.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg border-2 border-border bg-card text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada kode aktif.</p>
          )}
        </div>
      </div>
    </div>
  );
}