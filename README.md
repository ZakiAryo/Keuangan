# Personal Finance Tracker

Personal Finance Tracker adalah aplikasi keuangan pribadi berbasis web untuk
mencatat pemasukan, pengeluaran, saldo dompet, transfer, budget periode, dan
laporan keuangan dalam satu dashboard. Aplikasi memakai PIN gate sederhana
tanpa proses login atau registrasi.

Tujuan aplikasi ini adalah menyediakan pencatatan keuangan pribadi yang cepat,
privat, responsif, dan mudah dipasang di Vercel dengan database Supabase.

## Fitur Utama

- **PIN Gate tanpa login/register** dengan session cookie HTTP-only bertanda tangan.
- **Dashboard keuangan** untuk saldo, pemasukan, pengeluaran, budget, dan chart.
- **Manajemen transaksi** pemasukan dan pengeluaran lengkap dengan edit/hapus,
  detail transaksi, dan lampiran struk opsional.
- **Manajemen kategori** berdasarkan tipe pemasukan/pengeluaran dan metode
  pembayaran Cash/Non-Cash.
- **Manajemen wallet/dompet** dengan saldo awal dan saldo berjalan.
- **Transfer antar wallet** termasuk biaya transfer.
- **Budget periode** per kategori dengan rentang tanggal bebas dan indikator pemakaian.
- **Reminder tagihan** dengan tanggal jatuh tempo, nominal opsional, status
  terlambat/hari ini, dan penandaan sudah dibayar.
- **Laporan keuangan** berdasarkan rentang tanggal.
- **Export CSV** transaksi sesuai periode laporan.
- **Backup dan restore JSON** untuk seluruh data aplikasi.
- **Upload struk** JPEG, PNG, WebP, atau PDF ke Supabase Storage privat.
- **Responsive design** untuk desktop, tablet, dan mobile.
- **Dark premium UI** dengan Recharts dan ikon lucide-react.

## Tech Stack

| Teknologi | Penggunaan |
| --- | --- |
| Next.js App Router | Frontend, server route, middleware |
| TypeScript | Type safety aplikasi dan database |
| Tailwind CSS | Styling dan responsive layout |
| Supabase PostgreSQL | Penyimpanan data |
| Vercel | Hosting dan deployment |
| Recharts | Visualisasi data |
| lucide-react | Ikon antarmuka |
| Zod | Validasi request API |

Project ini tidak menggunakan `shadcn/ui`; komponen UI kecil dibuat lokal agar
dependency tetap ringkas.

## Struktur Folder

```text
.
├── app/
│   ├── api/
│   │   ├── auth-pin/
│   │   ├── backup/
│   │   ├── budgets/
│   │   ├── categories/
│   │   ├── dashboard/
│   │   ├── export/csv/
│   │   ├── logout/
│   │   ├── reports/
│   │   ├── transactions/
│   │   ├── transfers/
│   │   └── wallets/
│   ├── pin/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── app-shell.tsx
│   ├── dashboard-view.tsx
│   ├── transactions-view.tsx
│   ├── master-data-view.tsx
│   ├── transfers-view.tsx
│   ├── budgets-view.tsx
│   ├── reports-view.tsx
│   └── data-tools-view.tsx
├── docs/
├── lib/
│   ├── api.ts
│   ├── client-api.ts
│   ├── finance-data.ts
│   ├── session.ts
│   ├── supabase.ts
│   └── validation.ts
├── supabase/
│   └── schema.sql
├── types/
│   ├── database.ts
│   └── finance.ts
└── middleware.ts
```

- `app/`: halaman App Router dan layout global.
- `app/api/`: endpoint internal yang hanya dapat dipakai setelah session PIN valid.
- `components/`: view dan komponen UI aplikasi, termasuk
  `reminders-view.tsx`.
- `lib/`: autentikasi, Supabase server client, validasi, dan kalkulasi keuangan.
- `types/`: kontrak TypeScript untuk aplikasi dan schema database.
- `middleware.ts`: proteksi halaman dan API sebelum request masuk ke route.
- `supabase/schema.sql`: schema database kanonis yang dijalankan di Supabase.

## Environment Variables

Buat `.env.local` pada root project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
APP_PIN=your_pin
PIN_SESSION_SECRET=your_random_secret_at_least_32_characters
```

| Variable | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key untuk signed upload langsung dari browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci server untuk mengakses database; jangan dipakai di client. |
| `APP_PIN` | PIN yang harus dimasukkan untuk membuka aplikasi. |
| `PIN_SESSION_SECRET` | Secret acak untuk menandatangani cookie session PIN. |

Gunakan secret kuat, misalnya:

```bash
openssl rand -base64 48
```

> Jangan commit `.env.local` ke GitHub. Jangan expose
> `SUPABASE_SERVICE_ROLE_KEY`. `APP_PIN` hanya boleh disimpan di environment
> variable, bukan di source code.

## Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com/).
2. Buka **SQL Editor**.
3. Salin dan jalankan seluruh isi [`supabase/schema.sql`](supabase/schema.sql).
4. Pastikan tabel `categories`, `wallets`, `transactions`, `budgets`,
   `wallet_transfers`, dan `payment_reminders` tersedia.
5. Buka **Project Settings > API**.
6. Salin **Project URL** ke `NEXT_PUBLIC_SUPABASE_URL`.
7. Salin **anon key** ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
8. Salin **service_role key** ke `SUPABASE_SERVICE_ROLE_KEY`.
9. Masukkan variable yang sama ke Vercel saat deployment.

Untuk database yang sudah dibuat dengan schema versi sebelumnya, jalankan
[`supabase/migrations/20260607_add_category_payment_method.sql`](supabase/migrations/20260607_add_category_payment_method.sql)
agar kategori lama mendapat nilai default `non_cash`.

Untuk mengaktifkan lampiran transaksi pada database lama, jalankan juga
[`supabase/migrations/20260607_add_transaction_attachments.sql`](supabase/migrations/20260607_add_transaction_attachments.sql).
Migration ini menambahkan metadata lampiran dan bucket Storage privat.

Untuk mengaktifkan reminder pada database lama, jalankan
[`supabase/migrations/20260607_add_payment_reminders.sql`](supabase/migrations/20260607_add_payment_reminders.sql).

Untuk mengaktifkan rentang tanggal budget pada database lama, jalankan
[`supabase/migrations/20260607_update_budget_date_range.sql`](supabase/migrations/20260607_update_budget_date_range.sql).

RLS diaktifkan tanpa policy publik. Semua akses data dilakukan oleh route server
menggunakan service role key setelah session PIN diverifikasi.

## Database Schema

Schema berikut mencakup tabel, foreign key, index, trigger `updated_at`, RLS,
dan RPC restore. File kanonis tersedia di `supabase/schema.sql`.

```sql
create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  type text not null check (type in ('income', 'expense')),
  payment_method text not null default 'non_cash'
    check (payment_method in ('cash', 'non_cash')),
  color text not null default '#70e1b0',
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, type, payment_method)
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  type text not null,
  initial_balance numeric(18,2) not null default 0 check (initial_balance >= 0),
  color text not null default '#70e1b0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount numeric(18,2) not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 180),
  transaction_date date not null default current_date,
  notes text,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  category_id uuid not null references public.categories(id) on delete restrict,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'transaction-attachments',
  'transaction-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  month date not null default date_trunc('month', current_date)::date
    check (date_trunc('month', month)::date = month),
  start_date date not null default current_date,
  end_date date not null default current_date,
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date <= end_date),
  unique (category_id, start_date, end_date)
);

create table if not exists public.wallet_transfers (
  id uuid primary key default gen_random_uuid(),
  from_wallet_id uuid not null references public.wallets(id) on delete restrict,
  to_wallet_id uuid not null references public.wallets(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  fee numeric(18,2) not null default 0 check (fee >= 0),
  transfer_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_wallet_id <> to_wallet_id)
);

create table if not exists public.payment_reminders (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  due_date date not null,
  amount numeric(18,2) check (amount is null or amount > 0),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and paid_at is null) or
    (status = 'paid' and paid_at is not null)
  )
);

create index if not exists transactions_date_idx
  on public.transactions (transaction_date desc);
create index if not exists transactions_wallet_idx
  on public.transactions (wallet_id);
create index if not exists transactions_category_idx
  on public.transactions (category_id);
create index if not exists budgets_month_idx on public.budgets (month);
create index if not exists budgets_date_range_idx
  on public.budgets (start_date, end_date);
create index if not exists wallet_transfers_date_idx
  on public.wallet_transfers (transfer_date desc);
create index if not exists payment_reminders_status_due_date_idx
  on public.payment_reminders (status, due_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at before update on public.wallets
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at before update on public.budgets
for each row execute function public.set_updated_at();

drop trigger if exists wallet_transfers_set_updated_at on public.wallet_transfers;
create trigger wallet_transfers_set_updated_at before update on public.wallet_transfers
for each row execute function public.set_updated_at();

drop trigger if exists payment_reminders_set_updated_at on public.payment_reminders;
create trigger payment_reminders_set_updated_at before update on public.payment_reminders
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.wallet_transfers enable row level security;
alter table public.payment_reminders enable row level security;

create or replace function public.restore_finance_backup(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((payload ->> 'version')::int, 0) <> 1 then
    raise exception 'Versi backup tidak didukung';
  end if;

  delete from payment_reminders;
  delete from wallet_transfers;
  delete from budgets;
  delete from transactions;
  delete from wallets;
  delete from categories;

  insert into categories (
    id, name, type, payment_method, color, icon, created_at, updated_at
  )
  select id, name, type, coalesce(payment_method, 'non_cash'),
    color, icon, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,categories}')
    as x(id uuid, name text, type text, payment_method text, color text,
      icon text, created_at timestamptz, updated_at timestamptz);

  insert into wallets (id, name, type, initial_balance, color, created_at, updated_at)
  select id, name, type, initial_balance, color, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,wallets}')
    as x(id uuid, name text, type text, initial_balance numeric, color text,
      created_at timestamptz, updated_at timestamptz);

  insert into transactions (
    id, type, amount, description, transaction_date, notes, attachment_path,
    attachment_name, attachment_type, attachment_size,
    category_id, wallet_id, created_at, updated_at
  )
  select id, type, amount, description, transaction_date, notes,
    attachment_path, attachment_name, attachment_type, attachment_size,
    category_id, wallet_id, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,transactions}')
    as x(id uuid, type text, amount numeric, description text,
      transaction_date date, notes text, attachment_path text,
      attachment_name text, attachment_type text, attachment_size bigint,
      category_id uuid, wallet_id uuid, created_at timestamptz,
      updated_at timestamptz);

  insert into budgets (
    id, category_id, month, start_date, end_date, amount, created_at, updated_at
  )
  select id, category_id,
    coalesce(month, date_trunc('month', coalesce(start_date, current_date))::date),
    coalesce(start_date, month, current_date),
    coalesce(
      end_date,
      (date_trunc('month', coalesce(month, start_date, current_date)) +
        interval '1 month - 1 day')::date
    ),
    amount, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,budgets}')
    as x(
      id uuid, category_id uuid, month date, start_date date, end_date date,
      amount numeric, created_at timestamptz, updated_at timestamptz
    );

  insert into wallet_transfers (
    id, from_wallet_id, to_wallet_id, amount, fee, transfer_date,
    notes, created_at, updated_at
  )
  select id, from_wallet_id, to_wallet_id, amount, fee, transfer_date,
    notes, created_at, updated_at
  from jsonb_to_recordset(payload #> '{data,wallet_transfers}')
    as x(id uuid, from_wallet_id uuid, to_wallet_id uuid, amount numeric,
      fee numeric, transfer_date date, notes text,
      created_at timestamptz, updated_at timestamptz);

  insert into payment_reminders (
    id, title, due_date, amount, notes, status, paid_at, created_at, updated_at
  )
  select id, title, due_date, amount, notes, status, paid_at,
    created_at, updated_at
  from jsonb_to_recordset(
    coalesce(payload #> '{data,payment_reminders}', '[]'::jsonb)
  )
    as x(
      id uuid, title text, due_date date, amount numeric, notes text,
      status text, paid_at timestamptz, created_at timestamptz,
      updated_at timestamptz
    );
end;
$$;

revoke all on function public.restore_finance_backup(jsonb) from public;
revoke all on function public.restore_finance_backup(jsonb) from anon;
revoke all on function public.restore_finance_backup(jsonb) from authenticated;
grant execute on function public.restore_finance_backup(jsonb) to service_role;
```

## Menjalankan Project Lokal

Prasyarat: Node.js 20.9 atau lebih baru dan project Supabase aktif.

```bash
git clone <repository-url>
cd personal-finance-tracker
npm install
```

Buat `.env.local`, isi semua environment variable, lalu jalankan:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), masukkan `APP_PIN`, lalu
buat kategori dan wallet pertama.

Pemeriksaan sebelum commit:

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy ke Vercel

1. Push project ke repository GitHub privat.
2. Buka Vercel dan pilih **Add New Project**.
3. Import repository.
4. Tambahkan lima environment variable dari `.env.local`.
5. Deploy project.
6. Buka URL production dan test PIN gate.
7. Test pembuatan kategori, wallet, dan transaksi.
8. Pastikan `/api/dashboard` tanpa cookie mengembalikan status `401`.

Detail lengkap tersedia di [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Cara Menggunakan Aplikasi

1. Buka aplikasi dan masukkan PIN.
2. Buka **Data utama**, lalu tambahkan kategori pemasukan/pengeluaran dengan
   metode Cash atau Non-Cash.
3. Tambahkan wallet seperti rekening bank, cash, atau e-wallet.
4. Catat pemasukan pertama dan pilih metode pembayaran.
5. Catat pengeluaran harian sebagai Cash atau Non-Cash.
6. Pantau saldo dan grafik pada dashboard.
7. Buat budget periode per kategori pengeluaran.
8. Tambahkan reminder tagihan dan tandai sudah dibayar setelah selesai.
9. Buka laporan dan pilih rentang tanggal.
10. Export transaksi ke CSV atau buat backup JSON.

## API Documentation

Semua endpoint selain `POST /api/auth-pin` adalah endpoint internal dan harus
memeriksa session PIN. Middleware memberi proteksi awal; setiap route juga
memanggil `requirePinSession()`.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/api/auth-pin` | Verifikasi PIN dan membuat cookie session |
| POST | `/api/logout` | Menghapus cookie session |
| GET | `/api/dashboard` | Ringkasan dashboard dan chart |
| GET, POST | `/api/transactions` | Daftar/filter dan tambah transaksi |
| PUT, DELETE | `/api/transactions/:id` | Ubah atau hapus transaksi |
| GET, POST, PUT, DELETE | `/api/transactions/:id/attachment` | Lihat, izin upload, finalisasi/ganti, atau hapus lampiran |
| GET, POST | `/api/categories` | Daftar dan tambah kategori Cash/Non-Cash |
| PUT, DELETE | `/api/categories/:id` | Ubah atau hapus kategori |
| GET, POST | `/api/wallets` | Daftar wallet beserta saldo dan tambah wallet |
| PUT, DELETE | `/api/wallets/:id` | Ubah atau hapus wallet |
| GET, POST, DELETE | `/api/transfers` | Daftar, tambah, dan hapus transfer |
| GET, POST | `/api/budgets` | Daftar dan upsert budget |
| PUT, DELETE | `/api/budgets/:id` | Ubah atau hapus budget |
| GET, POST | `/api/reminders` | Daftar/filter dan tambah reminder |
| PUT, DELETE | `/api/reminders/:id` | Ubah status/data atau hapus reminder |
| GET | `/api/reports` | Laporan berdasarkan `from` dan `to` |
| GET | `/api/export/csv` | Download transaksi CSV |
| GET | `/api/backup` | Download seluruh data sebagai JSON |
| POST | `/api/backup/restore` | Restore seluruh data dari JSON |

Contoh membuat transaksi:

```http
POST /api/transactions
Content-Type: application/json

{
  "type": "expense",
  "amount": 75000,
  "description": "Belanja mingguan",
  "transaction_date": "2026-06-07",
  "category_id": "uuid-kategori",
  "wallet_id": "uuid-wallet",
  "notes": null
}
```

Response:

```json
{
  "data": {
    "id": "generated-uuid",
    "type": "expense",
    "amount": 75000,
    "description": "Belanja mingguan"
  }
}
```

Dokumentasi request, query parameter, response, dan error lengkap tersedia di
[`docs/API.md`](docs/API.md).

## Backup, Restore, dan Export

### Export CSV

Buka halaman **Laporan**, pilih periode, lalu klik **Export CSV**. File memuat
tanggal, tipe, deskripsi, kategori, wallet, jumlah, dan catatan.

### Backup JSON

Buka halaman **Data**, lalu klik **Unduh backup**. Backup menyimpan seluruh
tabel, termasuk reminder pembayaran, dengan format versi `1`.

Metadata lampiran ikut masuk ke JSON, tetapi file gambar/PDF tetap berada di
Supabase Storage dan tidak disematkan ke file backup agar ukuran backup tidak
melebihi batas server. Simpan file lampiran secara terpisah jika akan
memindahkan data ke project Supabase lain.

### Restore JSON

Buka halaman **Data**, pilih file backup, baca konfirmasi, lalu lanjutkan.
Restore dijalankan dalam transaksi PostgreSQL sehingga kegagalan akan
membatalkan seluruh perubahan.

> Restore mengganti seluruh data saat ini. Selalu buat backup baru sebelum
> melakukan restore dan jangan mengedit file JSON secara manual.

## Security Notes

- Aplikasi tidak menggunakan login/register.
- PIN gate adalah proteksi sederhana untuk penggunaan pribadi.
- Jangan membagikan URL aplikasi dan PIN.
- Gunakan repository privat.
- Jangan expose service role key ke frontend atau variable `NEXT_PUBLIC_*`.
- Service role key hanya dibaca di route server.
- Bucket lampiran bersifat privat dan file hanya dilayani melalui API yang
  memeriksa session PIN.
- Cookie session bersifat HTTP-only, `SameSite=Lax`, dan `Secure` di production.
- Jika dipakai multi-user, ganti PIN gate dengan Supabase Auth atau sistem auth lain.

Lihat [`docs/SECURITY.md`](docs/SECURITY.md) untuk threat model dan panduan upgrade.

## Responsive Design

- Desktop menggunakan sidebar tetap.
- Tablet memakai grid dan layout adaptif.
- Mobile menggunakan bottom navigation.
- Daftar transaksi mobile berbentuk card.
- Tabel desktop dapat berubah menjadi card pada layar kecil.
- Chart menggunakan container responsif.
- Form berubah dari multi-column menjadi single-column sesuai lebar layar.

## Troubleshooting

### PIN selalu salah

Pastikan `APP_PIN` di `.env.local` sama dengan input, tanpa tanda kutip atau
spasi. Restart server setelah mengubah environment variable.

### Supabase connection error

Periksa Project URL, service role key, status project Supabase, dan apakah
`supabase/schema.sql` sudah dijalankan.

### Data tidak muncul

Buka browser Network, periksa response API, lalu pastikan relasi foreign key
tersedia. Hapus filter laporan yang terlalu sempit.

### Environment variables belum terbaca

Restart `npm run dev`. Di Vercel, lakukan redeploy setelah menambah atau
mengubah environment variable.

### Error saat deploy Vercel

Pastikan Node.js yang digunakan kompatibel, seluruh variable tersedia untuk
environment Production, dan `npm run build` berhasil secara lokal.

### Middleware redirect loop

Pastikan `PIN_SESSION_SECRET` sama pada semua deployment dan cookie lama sudah
dihapus. Jangan mengubah nama cookie tanpa memperbarui middleware dan route.

### Service role key tidak boleh digunakan di frontend

Jangan import `lib/supabase.ts` ke Client Component. Key tidak boleh memiliki
prefix `NEXT_PUBLIC_`.

### Upload lampiran gagal karena kolom tidak ditemukan

Jika muncul pesan `column transactions.attachment_path does not exist`, kode
aplikasi sudah ter-deploy tetapi migration lampiran belum dijalankan. Buka
Supabase SQL Editor, jalankan:

```text
supabase/migrations/20260607_add_transaction_attachments.sql
```

Migration tersebut menambahkan metadata lampiran, membuat bucket Storage
private, memperbarui fungsi restore, dan meminta PostgREST memuat ulang schema.
Setelah selesai, muat ulang aplikasi dan coba upload kembali.

### Menu reminder gagal memuat

Jika muncul pesan bahwa tabel `payment_reminders` tidak ditemukan, jalankan
`supabase/migrations/20260607_add_payment_reminders.sql` melalui Supabase SQL
Editor. Migration juga memuat ulang schema PostgREST.

### Budget rentang tanggal gagal dimuat

Jika muncul pesan bahwa kolom `budgets.start_date` atau `budgets.end_date` tidak
ditemukan, jalankan `supabase/migrations/20260607_update_budget_date_range.sql`
melalui Supabase SQL Editor.

## Dokumentasi Tambahan

- [`docs/SETUP.md`](docs/SETUP.md)
- [`docs/DATABASE.md`](docs/DATABASE.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- [`docs/API.md`](docs/API.md)
- [`docs/UI-GUIDE.md`](docs/UI-GUIDE.md)
- [`docs/COLOR-CUSTOMIZATION.md`](docs/COLOR-CUSTOMIZATION.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)

## Roadmap

- Light mode.
- Kompresi dan optimasi otomatis bukti transaksi.
- Push notification dan reminder berulang.
- Target tabungan.
- Multi-user login.
- Import file Excel/CSV.
- PWA dan offline mode.

## Lisensi

Project ini disiapkan untuk penggunaan pribadi. Jika ingin didistribusikan,
tambahkan file `LICENSE` dan gunakan MIT License atau lisensi lain yang sesuai.
