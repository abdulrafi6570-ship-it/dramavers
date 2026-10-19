# DramaVers — Fase 1: UI/Konsep baru (ala TWIXTOR Archive)

## Cara pakai
1. Extract zip ini, install dependency baru:
   ```
   npm install
   ```
   (package-lock.json lama aku hapus karena ada 5 dependency baru: class-variance-authority, clsx, tailwind-merge, lucide-react — npm akan generate ulang)
2. Jalankan migration baru di Supabase SQL Editor: `migrations/phase1_engagement.sql`
   (ini tambahan tabel, aman dijalankan setelah `schema.sql` yang lama — tidak menghapus data)
3. `npm run dev` seperti biasa.

## Apa yang berubah di Fase 1

**Design system**
- Tema dark penuh ala TWIXTOR Archive, warna aksen pink/purple DramaVers dipertahankan
- Komponen UI baru ala shadcn/ui: `components/ui/button.jsx`, `card.jsx`, `badge.jsx`, `avatar.jsx`
- `lib/utils.js` — helper `cn()` buat gabungin className

**Navigasi**
- `components/BottomNav.js` — nav pill di bawah (mobile): Home / Video / Cari / Komunitas / Profil
- `components/Navbar.js` — dirombak, logo bold "DRAMAVERS"

**Halaman**
- Homepage: rail kategori scroll horizontal + grid card baru
- Halaman detail drama: dirombak total
- Halaman kategori: filter pill baru
- Halaman aktor: pakai komponen klip baru

**Fitur baru (klip)**
- Like, Bookmark, Copy Link, Download (dengan tracking jumlah download), dan Komentar — semua per klip
- API: `/api/clips/[id]/like`, `/bookmark`, `/comments`, `/download`
- Komponen: `ClipCard`, `ClipActions`, `ClipComments`
- Tabel baru: `clip_likes`, `clip_bookmarks`, `clip_comments`, `clip_downloads`

## Fase 2 (baru!) — Collections, Watch History, Leaderboard

**Collections (playlist pribadi)**
- Halaman `/collections` (daftar koleksi) & `/collections/[id]` (isi koleksi)
- Tombol folder di `ClipActions` → buka `AddToCollectionSheet` buat simpan klip ke koleksi (bisa buat koleksi baru langsung dari situ)
- API: `/api/collections`, `/api/collections/[id]`, `/api/collections/[id]/clips/[clipId]`

**Watch History**
- Halaman `/watch-history` — otomatis kecatat tiap kali user pencet play di video (lewat `/api/clips/[id]/view`)

**Leaderboard streak login**
- Halaman `/leaderboard` — ranking berdasarkan streak login terpanjang & total hari login
- Login sekarang otomatis mencatat `user_login_days` tiap hari (di `/api/auth/login`)

**Akses fitur baru**: lewat halaman profil sendiri (`/profile/[username]`) ada menu baru: Koleksi Kamu, Riwayat Tontonan, Leaderboard Streak.

**Migration tambahan**: jalankan `migrations/phase2_collections_history_leaderboard.sql` di Supabase (setelah phase1).

## Fase 3 (baru!) — Admin: Settings, Inbox, Analytics

**Site Settings** (`/admin/settings`, admin only)
- Toggle & URL backsound (musik latar web) — otomatis nyala di semua halaman via `BacksoundPlayer` (browser tetap butuh 1 klik kalau autoplay bersuara diblokir, itu batasan browser bukan bug)
- Konfigurasi donasi: QRIS (gambar), DANA, GoPay, link Saweria
- Disimpan di tabel `app_settings` yang sudah ada dari awal (tidak perlu migration baru untuk ini)

**Halaman Donasi publik** (`/donate`) — nampilin metode donasi yang diisi admin, bisa diakses dari ikon ❤️ di navbar atau menu profil

**Inbox Pesan User** (`/admin/inbox`, admin only)
- List semua percakapan DM masuk ke admin, dengan badge jumlah pesan belum dibaca
- Klik salah satu → masuk ke `/chat/[username]` yang sudah ada, otomatis mark-as-read
- Migration: `messages.read_at` (kolom baru, lihat `phase3_inbox_settings.sql`)

**Analitik** (`/admin/analytics`, admin only)
- Total user, drama, klip, tontonan, download, like, komentar
- Top 5 drama paling banyak ditonton

**Migration tambahan**: jalankan `migrations/phase3_inbox_settings.sql` di Supabase (setelah phase1 & phase2).

## Fase 4 (baru!) — Gamification, Request & Feedback

**Badge / Pencapaian** — dihitung otomatis (tanpa tabel baru) dari data yang sudah ada: streak login, jumlah tontonan, like, koleksi, komentar, request. Muncul di halaman profil siapapun.

**Request Klip** (`/requests`)
- User bisa request drama/aktor/scene/episode yang belum ada
- Voting (upvote) — otomatis urut dari vote terbanyak
- Link dari menu profil

**Feedback**
- Tombol mengambang 💬 di pojok kiri bawah (semua halaman) — kirim masukan/bug report, bisa dipakai tanpa login
- `/admin/feedback` — admin bisa lihat semua feedback & ubah status (Baru/Dibaca/Selesai)

**Migration tambahan**: jalankan `migrations/phase4_requests_feedback.sql` di Supabase (setelah phase1, phase2, phase3).

## Ringkasan semua fase (selesai)
1. Design system dark ala TWIXTOR + bottom nav + like/bookmark/copy-link/download/komentar per klip
2. Collections, Watch History, Leaderboard streak
3. Admin: site settings (backsound & donasi), inbox pesan, analitik
4. Badge pencapaian, request klip + voting, feedback user

Kalau ada bagian yang mau di-polish lebih lanjut (misal: notifikasi real-time, upload gambar feedback, halaman request khusus admin buat approve/reject), tinggal bilang aja.

## Catatan penting
- Aku kerja tanpa akses internet di sandbox ini, jadi kode ini **belum pernah di-`npm install` / di-build / dijalankan** langsung olehku. Sudah aku cek konsistensi import & syntax secara manual, tapi tolong jalankan `npm run dev` dan cek console kalau ada error kecil yang kelewat.
