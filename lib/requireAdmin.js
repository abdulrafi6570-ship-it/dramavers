import { NextResponse } from 'next/server';
import { getSession } from './auth';

// Pastikan hanya admin yang bisa lanjut. Return null kalau lolos,
// atau langsung Response 401/403 kalau tidak.
export function requireAdmin() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Khusus admin' }, { status: 403 });
  return null;
}
