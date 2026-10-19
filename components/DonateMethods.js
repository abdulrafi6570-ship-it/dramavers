'use client';

import { useEffect, useRef, useState } from 'react';
import { QrCode, Wallet, Coffee, Copy, Check, ExternalLink, Heart } from 'lucide-react';

const ICONS = { qris: QrCode, dana: Wallet, gopay: Wallet, saweria: Coffee };
const ICON_CLASS = {
  qris: 'text-foreground',
  dana: 'text-blue-500',
  gopay: 'text-emerald-500',
  saweria: 'text-amber-500',
};

const STEPS = {
  qris: [
    'Simpan atau screenshot kode QR di atas.',
    'Buka aplikasi e-wallet atau m-banking kamu, lalu pilih menu Scan atau Bayar.',
    'Pilih gambar QR dari galeri, atau scan langsung dari layar perangkat lain.',
    'Masukkan nominal sesukamu, lalu konfirmasi pembayaran.',
  ],
  dana: [
    'Salin nomor DANA di atas.',
    'Buka aplikasi DANA, lalu pilih menu Kirim atau Transfer.',
    'Tempel nomor tujuan, lalu isi nominal sesukamu.',
    'Konfirmasi dengan PIN kamu. Selesai!',
  ],
  gopay: [
    'Salin nomor GoPay di atas.',
    'Buka aplikasi Gojek atau GoPay, lalu pilih menu Bayar atau Transfer.',
    'Tempel nomor tujuan, lalu isi nominal sesukamu.',
    'Konfirmasi dengan PIN kamu. Selesai!',
  ],
  saweria: [
    'Tekan tombol "Buka Saweria" di atas.',
    'Isi nama (boleh disamarkan) dan nominal dukunganmu.',
    'Pilih metode pembayaran yang paling nyaman buat kamu.',
    'Tinggalkan pesan semangat kalau kamu mau 💛',
  ],
};

// Ubah teks ini kalau mau ganti kata-kata terima kasihnya.
const THANKS = [
  'Terima kasih banyak sudah mampir dan mau mempertimbangkan untuk mendukung DramaVers. Dukunganmu benar-benar berarti.',
  'Setiap donasi, berapa pun nominalnya, dipakai untuk menjaga web ini tetap hidup: biaya server, penyimpanan video, dan pengembangan fitur-fitur baru supaya klip favoritmu makin nyaman ditonton.',
  'Kalau belum bisa berdonasi sekarang, itu sama sekali tidak apa-apa. Menonton, membagikan web ini ke teman, atau mengirim masukan lewat Feedback juga sudah sangat membantu.',
  'Sekali lagi, terima kasih sudah jadi bagian dari DramaVers.',
];

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function DonateMethods({ methods = [], defaultActive = null }) {
  const [active, setActive] = useState(defaultActive);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef(null);

  const current = methods.find((m) => m.key === active) || null;

  // Pastikan detail kelihatan di HP setelah kartu ditekan
  useEffect(() => {
    if (current && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCopy(value) {
    const ok = await copyText(value);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 text-left">
      {/* Pilihan metode */}
      <div className="grid grid-cols-2 gap-3">
        {methods.map((m) => {
          const Icon = ICONS[m.key] || Wallet;
          const on = active === m.key;
          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setCopied(false);
                setActive(on ? null : m.key);
              }}
              className={`space-y-2 rounded-2xl border bg-card p-4 text-left transition ${
                on
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:border-primary/60'
              }`}
            >
              <Icon size={22} className={ICON_CLASS[m.key]} />
              <p className="text-sm font-bold">{m.label}</p>
              <p className="truncate text-xs text-muted-foreground">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Detail metode yang dipilih */}
      {current && (
        <div
          ref={panelRef}
          className="animate-slide-up space-y-5 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-primary" />
            <h2 className="text-base font-bold">Donasi via {current.label}</h2>
          </div>

          {/* Isi utama */}
          {current.key === 'qris' && (
            <div className="space-y-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.value}
                alt="Kode QRIS"
                className="mx-auto h-56 w-56 rounded-xl bg-white object-contain p-2"
              />
              <a
                href={current.value}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <ExternalLink size={13} /> Buka gambar penuh
              </a>
            </div>
          )}

          {(current.key === 'dana' || current.key === 'gopay') && (
            <div className="rounded-xl border border-border bg-background p-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nomor {current.label}
              </p>
              <p className="mt-1 break-all font-mono text-xl font-bold tracking-wide">
                {current.value}
              </p>
              <button
                type="button"
                onClick={() => onCopy(current.value)}
                className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold transition hover:border-primary/60"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? 'Nomor tersalin' : 'Salin nomor'}
              </button>
            </div>
          )}

          {current.key === 'saweria' && (
            <a
              href={current.value}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <ExternalLink size={16} /> Buka Saweria
            </a>
          )}

          {/* Cara berdonasi */}
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
              Cara berdonasi
            </p>
            <ol className="space-y-2">
              {(STEPS[current.key] || []).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-6">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-foreground/85">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Ucapan terima kasih */}
          <div className="space-y-2 rounded-xl bg-primary/10 p-4">
            <p className="text-sm font-bold">Terima kasih 💛</p>
            {THANKS.map((t, i) => (
              <p key={i} className="text-sm leading-6 text-foreground/80">
                {t}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}