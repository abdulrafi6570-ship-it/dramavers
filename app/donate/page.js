export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Heart } from 'lucide-react';
import { getSettings } from '../../lib/settings';
import DonateMethods from '../../components/DonateMethods';

export default async function DonatePage() {
  const s = await getSettings();

  // Hanya data biasa (bukan komponen), supaya aman dikirim ke komponen client
  const methods = [
    s.donation_qris_url && { key: 'qris', label: 'QRIS', desc: 'Scan & Pay', value: s.donation_qris_url },
    s.donation_dana && { key: 'dana', label: 'DANA', desc: s.donation_dana, value: s.donation_dana },
    s.donation_gopay && { key: 'gopay', label: 'GoPay', desc: s.donation_gopay, value: s.donation_gopay },
    s.donation_saweria_url && { key: 'saweria', label: 'Saweria', desc: 'Support via Saweria', value: s.donation_saweria_url },
  ].filter(Boolean);

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in text-center">
      <div className="flex justify-center"><Heart size={32} className="text-primary" /></div>
      <div>
        <h1 className="text-xl font-bold">Dukung DramaVers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kalau web ini membantu kamu, pertimbangkan untuk mendukung project ini.
        </p>
      </div>

      {methods.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada metode donasi yang diatur admin.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Pilih salah satu metode untuk melihat detailnya.</p>
          <DonateMethods methods={methods} />
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Setiap donasi, besar atau kecil, membantu menjaga web ini tetap hidup. Terima kasih telah mendukung 💜
      </p>
    </div>
  );
}