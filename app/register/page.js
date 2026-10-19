'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', display_name: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Gagal daftar');
    router.push('/');
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-1">Daftar</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Nama tampilan & bio opsional, bisa diisi/diubah nanti di profil.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input className="input" placeholder="Username TikTok" value={form.username}
            onChange={(e) => set('username', e.target.value)} />
          <input className="input" placeholder="Password (min 6 karakter)" type="password" value={form.password}
            onChange={(e) => set('password', e.target.value)} />
          <input className="input" placeholder="Nama tampilan (opsional)" value={form.display_name}
            onChange={(e) => set('display_name', e.target.value)} />
          <textarea className="input" placeholder="Bio (opsional)" value={form.bio}
            onChange={(e) => set('bio', e.target.value)} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          Sudah punya akun? <Link href="/login" className="text-accent2">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
