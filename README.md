# DramaVers

Web klip drama Asia/Western/JKT48/KPOP/Anime dengan kategori, aktor, kode unlock download via TikTok, chat, follow, dan panel admin. Dibangun pakai Next.js 14 (App Router) + Supabase + Cloudflare R2.

## 1. Siapkan database

1. Buka project Supabase kamu → **SQL Editor** → **New query**.
2. Copy-paste seluruh isi file `schema.sql`, lalu jalankan (Run).
   Ini akan membuat semua tabel, dan otomatis mengisi 5 kategori dasar (ASIA, WESTERN, JKT48, KPOP, ANIME) + 4 sub-kategori Asia (KDrama, JDrama, CDrama, IDrama).

## 2. Install & jalankan lokal

```bash
npm install
npm run seed:admin   # bikin akun admin (usn & pw dari .env.local)
npm run dev
```

Buka http://localhost:3000, lalu login admin pakai username **rapp** & password **rapp123** (bisa diganti di `.env.local` sebelum jalanin `seed:admin`).

## 3. Kode unlock download

Kode default: `DRAMAVERS2026` (tersimpan di tabel `app_settings`, kolom `key = 'download_unlock_code'`). Untuk ganti kode yang kamu post di TikTok, tinggal update value-nya lewat Supabase Table Editor:

```
table: app_settings
key: download_unlock_code
value: <kode barumu>
```

(Nanti kalau mau, aku bisa buatkan halaman admin khusus buat ganti kode ini tanpa buka Supabase.)

## 4. Alur pakai

- **Admin** login → menu **Admin** di navbar → tambah kategori/sub-kategori → tambah aktor → tambah drama (pilih kategori + tag aktor + upload poster) → upload klip (pilih drama, upload video dari galeri, tag aktor di klip itu).
- **User biasa** daftar pakai username TikTok + password → browse kategori → buka drama → kalau mau download, masukkan kode dari postingan TikTok (cukup sekali seumur akun) → bisa follow user lain, chat pribadi/global, share drama ke chat, edit profil (nama bebas kapan saja, username maksimal ganti tiap 3 hari, bio, foto profil).

## 5. Deploy

Paling gampang pakai **Vercel**:
1. Push folder ini ke GitHub repo.
2. Import ke Vercel, isi semua Environment Variables dari `.env.local` (jangan commit `.env.local` ke repo — sudah masuk `.gitignore`).
3. Deploy.

## Catatan penting / batasan versi ini

- **Upload video lewat form admin** saat ini lewat server (Next.js API route) sebelum ke R2. Untuk file video yang cukup besar (puluhan-ratusan MB) di hosting serverless (Vercel dsb), ini bisa kena limit ukuran request. Kalau nanti sering gagal upload video besar, kabari saya — solusinya ganti ke **presigned URL** (browser upload langsung ke R2, tanpa lewat server).
- Chat masih pakai **polling** (refresh tiap 4 detik), bukan realtime websocket. Cukup untuk versi awal; bisa di-upgrade ke Supabase Realtime kalau mau instan.
- Belum ada halaman admin untuk kelola kredit user / ganti kode unlock lewat UI (masih manual lewat Supabase Table Editor) — bisa ditambah menyusul.
- Belum ada rate-limiting / captcha di register-login — untuk produksi publik sebaiknya ditambahkan.
