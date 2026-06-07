# Setup Lokal

Dokumen ini menjelaskan cara menyiapkan Personal Finance Tracker pada komputer
developer.

## Prasyarat

- Node.js 20.9 atau lebih baru.
- npm 10 atau lebih baru.
- Git.
- Project Supabase aktif.
- Browser modern.

Periksa versi:

```bash
node --version
npm --version
git --version
```

## Clone Repository

```bash
git clone <repository-url>
cd personal-finance-tracker
```

## Install Dependencies

```bash
npm install
```

Dependency utama meliputi Next.js, Supabase JS, Recharts, lucide-react, Zod,
dan Tailwind CSS.

## Setup Database

1. Buat project Supabase.
2. Buka **SQL Editor**.
3. Jalankan isi `supabase/schema.sql`.
4. Pastikan enam tabel dan fungsi `restore_finance_backup` berhasil dibuat.
5. Ambil Project URL dan service role key dari **Project Settings > API**.

Jika database sudah memakai versi lama tanpa klasifikasi Cash/Non-Cash, jalankan:

```text
supabase/migrations/20260607_add_category_payment_method.sql
```

Migration mempertahankan data lama dan mengklasifikasikannya sebagai
`non_cash` sampai kategori tersebut diedit.

Untuk database lama yang belum mendukung upload struk, jalankan:

```text
supabase/migrations/20260607_add_transaction_attachments.sql
```

Migration membuat kolom metadata lampiran dan bucket Storage privat
`transaction-attachments`.

Untuk database lama yang belum memiliki reminder tagihan, jalankan:

```text
supabase/migrations/20260607_add_payment_reminders.sql
```

Migration membuat tabel reminder, index jatuh tempo, trigger `updated_at`, dan
memperbarui fungsi restore agar backup lama tetap dapat dipakai.

Untuk database lama yang masih memakai budget bulanan, jalankan:

```text
supabase/migrations/20260607_update_budget_date_range.sql
```

Migration menambahkan `start_date` dan `end_date`, mengubah budget lama menjadi
rentang satu bulan, dan memperbarui fungsi restore.

Panduan database lengkap tersedia di [DATABASE.md](DATABASE.md).

## Setup `.env.local`

Salin format dari `.env.example` ke file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_PIN=123456
PIN_SESSION_SECRET=replace_with_a_long_random_secret
```

Buat secret acak:

```bash
openssl rand -base64 48
```

Catatan:

- Jangan commit `.env.local`.
- Jangan menambahkan prefix `NEXT_PUBLIC_` pada service role key.
- Anon key boleh berada di browser dan dipakai hanya untuk signed upload.
- Jangan menulis PIN di komponen React atau route.
- Gunakan PIN dan secret berbeda antara development dan production.

## Jalankan Project

```bash
npm run dev
```

Buka `http://localhost:3000`. Middleware akan mengarahkan browser ke `/pin`.

Urutan setup data awal:

1. Masukkan PIN.
2. Buka menu **Data utama**.
3. Tambahkan minimal satu kategori pemasukan Cash atau Non-Cash.
4. Tambahkan minimal satu kategori pengeluaran Cash atau Non-Cash.
5. Tambahkan minimal satu wallet.
6. Mulai mencatat transaksi.

## Pemeriksaan Project

```bash
npm run typecheck
npm run lint
npm run build
```

Semua command harus berhasil sebelum perubahan di-push.

## Struktur Awal Aplikasi

```text
app/
  api/             Route server dan endpoint internal
  pin/             Halaman PIN gate
  globals.css      Theme dan utility CSS
  layout.tsx       Root layout
  page.tsx         Dashboard utama
components/        View dan komponen antarmuka
lib/               Session, Supabase, validasi, kalkulasi
types/             Tipe domain dan database
supabase/           Schema SQL kanonis
docs/               Dokumentasi developer
middleware.ts      Proteksi halaman dan endpoint
```

## Alur Request

```text
Browser
  -> Middleware memeriksa cookie session
  -> API route memeriksa session kembali
  -> Zod memvalidasi request
  -> Supabase service role menjalankan query server-side
  -> JSON dikirim ke browser
```

Supabase client admin tidak boleh di-import ke file dengan directive
`"use client"`.
