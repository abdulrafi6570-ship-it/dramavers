import { redirect } from 'next/navigation';

// Halaman utama admin -> langsung ke dashboard analitik
export default function AdminIndexPage() {
  redirect('/admin/analytics');
}
