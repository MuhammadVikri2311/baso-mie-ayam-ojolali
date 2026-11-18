# Baso & Mie Ayam Ojolali

Aplikasi web untuk membantu UMKM mengelola pemesanan makanan dan operasional toko. Sistem menyediakan portal Admin, Kasir, dan Pelanggan, serta chatbot AI yang menyesuaikan informasi dengan hak akses pengguna.

## Fitur

### Pelanggan
- Registrasi dan login.
- Melihat katalog makanan dan minuman.
- Mengelola keranjang belanja.
- Checkout pesanan.
- Melihat informasi pesanan.

### Kasir
- Dashboard kasir.
- Melihat pesanan masuk.
- Mencatat pembayaran **CASH**.
- Mengubah status pesanan dari **MENUNGGU** menjadi **SELESAI**.
- Melihat riwayat transaksi.

### Admin
- Dashboard admin.
- Mengelola produk dan kategori.
- Melihat data pelanggan.
- Memantau pesanan.
- Melihat laporan penjualan.
- Mengelola konfigurasi sistem.

### Fitur pendukung
- Chatbot AI dengan pembatasan akses berdasarkan role.
- Notifikasi pesanan melalui email dan suara sesuai konfigurasi.
- Unit testing menggunakan Vitest.
- CI menggunakan GitHub Actions.

> Catatan: metode pembayaran aktif pada website adalah CASH. QRIS dan transfer bank tidak termasuk alur pembayaran aktif. Status operasional yang digunakan pada website adalah MENUNGGU dan SELESAI.

## Teknologi
- Next.js
- React
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- NextAuth
- Vitest
- GitHub Actions

## Persyaratan
- Node.js versi 20 atau versi yang kompatibel dengan proyek.
- npm.
- Database PostgreSQL.
- Environment variable yang diperlukan aplikasi.

## Instalasi

1. Clone repository:

   ```bash
   git clone https://github.com/MuhammadVikri2311/baso-mie-ayam-ojolali.git
   cd baso-mie-ayam-ojolali
   ```

2. Install dependencies:

   ```bash
   npm ci --legacy-peer-deps
   ```

3. Buat file `.env.local` berdasarkan kebutuhan konfigurasi proyek. Isi connection string database, secret autentikasi, dan kredensial layanan eksternal secara lokal. **Jangan commit file `.env.local` atau membagikan API key.**

4. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

5. Jalankan aplikasi dalam mode pengembangan:

   ```bash
   npm run dev
   ```

6. Buka `http://localhost:3000` pada browser.

> Jika proyek memerlukan migrasi database, periksa skema dan prosedur migrasi terlebih dahulu. Jangan menjalankan reset database pada database yang berisi data penting.

## Pengujian

Jalankan unit test:

```bash
npm run test:run
```

Jalankan pemeriksaan TypeScript:

```bash
npx tsc --noEmit
```

Jalankan ESLint:

```bash
npm run lint
```

Build production:

```bash
npm run build
```

## CI/CD

Workflow berada pada `.github/workflows/ci.yml`. Workflow berjalan pada push ke branch `main` dan pull request menuju `main`, lalu menjalankan instalasi dependensi, Prisma generate, lint, type check, unit test, dan build.

Repository: https://github.com/MuhammadVikri2311/baso-mie-ayam-ojolali

GitHub Actions: https://github.com/MuhammadVikri2311/baso-mie-ayam-ojolali/actions

Salah satu run yang dilaporkan berhasil: https://github.com/MuhammadVikri2311/baso-mie-ayam-ojolali/actions/runs/44315630301

## Dokumentasi dan Demo

- Laporan akhir PRD/SRS + SDD: `Laporan_Akhir_Baso_Mie_Ayam_Ojolali.pdf`
- Video demo aplikasi: [Tambahkan tautan video setelah diunggah]
- Video progres 1: [Tambahkan tautan jika diwajibkan]
- Video progres 2: [Tambahkan tautan jika diwajibkan]

## Catatan Keamanan

- Jangan menyimpan `.env`, `.env.local`, password, database URL produksi, atau API key di repository.
- Gunakan environment variable pada mesin lokal dan secret manager pada layanan deployment.
- Jangan menampilkan data pribadi pelanggan pada video demo publik.
