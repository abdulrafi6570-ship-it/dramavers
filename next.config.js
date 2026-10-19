/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
    ],
  },
  experimental: {
    // Halaman dinamis selalu diambil ulang saat dibuka / tombol kembali,
    // supaya data terbaru (donasi, dll.) tidak terlihat kosong karena salinan lama.
    staleTimes: { dynamic: 0 },
  },
};
module.exports = nextConfig;