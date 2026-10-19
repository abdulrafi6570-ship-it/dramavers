'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Gagal login');
    router.push('/');
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="card p-6">
        <h1 className="text-xl font-bold mb-1">Masuk</h1>
        <p className="text-sm text-muted-foreground mb-4">Pakai username TikTok kamu.</p>
        <form onSubmit={submit} className="space-y-3">
          <input className="input" placeholder="Username TikTok" value={username}
            onChange={(e) => setUsername(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">
          Belum punya akun? <Link href="/register" className="text-accent2">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
