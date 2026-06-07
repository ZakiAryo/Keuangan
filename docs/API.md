# API Documentation

Base URL lokal:

```text
http://localhost:3000
```

Semua response menggunakan JSON kecuali endpoint export CSV. Seluruh endpoint
selain `POST /api/auth-pin` memerlukan cookie session PIN yang valid.

## Format Response

Response sukses:

```json
{
  "data": {}
}
```

Response operasi tanpa data:

```json
{
  "success": true
}
```

Response error:

```json
{
  "error": "Pesan error",
  "details": {}
}
```

Status umum:

| Status | Arti |
| --- | --- |
| `200` | Berhasil |
| `201` | Data berhasil dibuat |
| `400` | Body, parameter, atau format data tidak valid |
| `401` | Session PIN tidak valid |
| `500` | Konfigurasi, database, atau server error |

## Authentication

### POST `/api/auth-pin`

Memverifikasi PIN dan membuat cookie session HTTP-only.

Request body:

```json
{
  "pin": "123456"
}
```

Response:

```json
{
  "success": true
}
```

PIN salah:

```json
{
  "error": "PIN salah."
}
```

### POST `/api/logout`

Menghapus cookie session. Tidak memiliki request body.

Response:

```json
{
  "success": true
}
```

## Dashboard

### GET `/api/dashboard`

Mengambil total saldo, pemasukan/pengeluaran bulan berjalan, budget, saldo per
wallet, transaksi terbaru, tren enam bulan, dan pengeluaran per kategori.

Response ringkas:

```json
{
  "data": {
    "totals": {
      "balance": 12500000,
      "income": 5000000,
      "expense": 2100000,
      "budget": 3000000,
      "budgetUsed": 1750000
    },
    "wallets": [],
    "recentTransactions": [],
    "monthlyTrend": [],
    "expenseByCategory": []
  }
}
```

## Transactions

### GET `/api/transactions`

Mengambil transaksi, diurutkan dari tanggal terbaru.

Query params opsional:

| Param | Format | Fungsi |
| --- | --- | --- |
| `from` | `YYYY-MM-DD` | Tanggal minimum |
| `to` | `YYYY-MM-DD` | Tanggal maksimum |
| `type` | `income` atau `expense` | Filter tipe |
| `wallet_id` | UUID | Filter wallet |
| `category_id` | UUID | Filter kategori |
| `payment_method` | `cash` atau `non_cash` | Filter metode kategori |
| `limit` | number, maksimum 1000 | Jumlah data |

Contoh:

```http
GET /api/transactions?from=2026-06-01&to=2026-06-30&type=expense
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "expense",
      "amount": 75000,
      "description": "Belanja mingguan",
      "transaction_date": "2026-06-07",
      "category_id": "uuid",
      "wallet_id": "uuid",
      "notes": null,
      "category": {
        "id": "uuid",
        "name": "Kebutuhan",
        "color": "#fb7185",
        "type": "expense",
        "payment_method": "cash"
      },
      "wallet": {
        "id": "uuid",
        "name": "Bank",
        "color": "#60a5fa"
      }
    }
  ]
}
```

### POST `/api/transactions`

Membuat transaksi.

Request body:

```json
{
  "type": "expense",
  "amount": 75000,
  "description": "Belanja mingguan",
  "transaction_date": "2026-06-07",
  "category_id": "uuid-kategori",
  "wallet_id": "uuid-wallet",
  "notes": "Pasar"
}
```

`category_id` harus sesuai dengan tipe transaksi pada sisi aplikasi. Database
menjamin referensi kategori dan wallet tetap valid.

### PUT `/api/transactions/:id`

Memperbarui transaksi. Body boleh berisi sebagian field:

```json
{
  "amount": 80000,
  "notes": "Harga diperbarui"
}
```

### DELETE `/api/transactions/:id`

Menghapus transaksi.

Response:

```json
{
  "success": true
}
```

Jika transaksi memiliki lampiran, file di Supabase Storage ikut dibersihkan.

### POST `/api/transactions/:id/attachment`

Membuat signed upload token untuk mengirim file langsung dari browser ke
Supabase Storage. Pendekatan ini menghindari batas payload Vercel Function.

Format yang diterima:

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`

Ukuran maksimal 10 MB. Server memeriksa MIME dan signature file.

```json
{
  "name": "struk-belanja.jpg",
  "type": "image/jpeg",
  "size": 2458120
}
```

Response:

```json
{
  "data": {
    "path": "transaction-uuid/random-uuid.jpg",
    "token": "short-lived-upload-token"
  }
}
```

Browser mengupload binary memakai Supabase `uploadToSignedUrl`, lalu memanggil
endpoint `PUT` untuk finalisasi.

### PUT `/api/transactions/:id/attachment`

Memvalidasi signature file yang sudah diupload, menyimpan metadata, dan
menghapus lampiran lama bila ada.

```json
{
  "path": "transaction-uuid/random-uuid.jpg",
  "name": "struk-belanja.jpg",
  "type": "image/jpeg",
  "size": 2458120
}
```

### GET `/api/transactions/:id/attachment`

Memverifikasi session PIN lalu mengarahkan browser ke signed download URL yang
berlaku singkat.

Tambahkan `?download=1` untuk mengunduh:

```http
GET /api/transactions/transaction-uuid/attachment?download=1
```

### DELETE `/api/transactions/:id/attachment`

Menghapus file dan metadata lampiran tanpa menghapus transaksi.

## Categories

### GET `/api/categories`

Mengambil seluruh kategori, diurutkan berdasarkan tipe dan nama.

### POST `/api/categories`

Request body:

```json
{
  "name": "Makanan",
  "type": "expense",
  "payment_method": "cash",
  "color": "#fb7185",
  "icon": "food"
}
```

`payment_method` harus `cash` atau `non_cash`. `icon` opsional dan `color`
harus berupa hex enam digit.

### PUT `/api/categories/:id`

Memperbarui sebagian atau seluruh field kategori.

```json
{
  "name": "Makan dan Minum",
  "color": "#f97316"
}
```

### DELETE `/api/categories/:id`

Menghapus kategori. Operasi akan gagal jika kategori masih direferensikan oleh
transaksi. Budget kategori terhapus otomatis karena memakai `ON DELETE CASCADE`.

## Wallets

### GET `/api/wallets`

Mengambil seluruh wallet beserta `balance` yang dihitung:

```text
saldo awal
+ pemasukan
- pengeluaran
+ transfer masuk
- transfer keluar
- biaya transfer keluar
```

### POST `/api/wallets`

Request body:

```json
{
  "name": "BCA",
  "type": "Bank",
  "initial_balance": 1000000,
  "color": "#60a5fa"
}
```

### PUT `/api/wallets/:id`

Memperbarui wallet.

```json
{
  "name": "Rekening Utama",
  "color": "#2563eb"
}
```

### DELETE `/api/wallets/:id`

Menghapus wallet. Operasi gagal jika wallet masih memiliki transaksi atau
transfer karena relasi memakai `ON DELETE RESTRICT`.

## Transfers

### GET `/api/transfers`

Mengambil transfer terbaru lengkap dengan wallet asal dan tujuan.

### POST `/api/transfers`

Request body:

```json
{
  "from_wallet_id": "uuid-wallet-asal",
  "to_wallet_id": "uuid-wallet-tujuan",
  "amount": 500000,
  "fee": 2500,
  "transfer_date": "2026-06-07",
  "notes": "Pindah dana"
}
```

Wallet asal dan tujuan harus berbeda. `fee` boleh `0`.

### DELETE `/api/transfers?id=:id`

Menghapus transfer berdasarkan UUID pada query param.

```http
DELETE /api/transfers?id=transfer-uuid
```

## Budgets

### GET `/api/budgets`

Mengambil budget dan nilai `spent`. Pemakaian budget dihitung dari semua
transaksi `expense` pada rentang `start_date` sampai `end_date` dengan nama
kategori yang sama, tanpa memisahkan Cash dan Non-Cash.

Query param opsional:

| Param | Format | Fungsi |
| --- | --- | --- |
| `from` | `YYYY-MM-DD` | Ambil budget yang beririsan setelah tanggal ini |
| `to` | `YYYY-MM-DD` | Ambil budget yang beririsan sebelum tanggal ini |

Contoh:

```http
GET /api/budgets?from=2026-06-01&to=2026-06-30
```

### POST `/api/budgets`

Membuat atau memperbarui budget berdasarkan kombinasi `category_id`,
`start_date`, dan `end_date`.

```json
{
  "category_id": "uuid-kategori-pengeluaran",
  "start_date": "2026-06-01",
  "end_date": "2026-06-30",
  "amount": 1500000
}
```

`category_id` harus berasal dari kategori pengeluaran. Tanggal awal tidak boleh
melewati tanggal akhir.

### PUT `/api/budgets/:id`

Memperbarui budget berdasarkan UUID.

```json
{
  "start_date": "2026-06-05",
  "end_date": "2026-07-04",
  "amount": 1750000
}
```

### DELETE `/api/budgets/:id`

Menghapus budget.

## Reminders

Reminder adalah notifikasi di dalam aplikasi. Endpoint ini belum mengirim push
notification, email, atau WhatsApp.

### GET `/api/reminders`

Mengambil reminder yang diurutkan dari tanggal jatuh tempo terdekat.

Query param opsional:

| Param | Nilai | Fungsi |
| --- | --- | --- |
| `status` | `pending` atau `paid` | Filter status pembayaran |

```http
GET /api/reminders?status=pending
```

Response:

```json
{
  "data": [
    {
      "id": "reminder-uuid",
      "title": "Bayar listrik",
      "due_date": "2026-06-15",
      "amount": 450000,
      "notes": "Bayar melalui aplikasi bank",
      "status": "pending",
      "paid_at": null
    }
  ]
}
```

### POST `/api/reminders`

Membuat reminder baru. `amount` dan `notes` boleh `null`.

```json
{
  "title": "Bayar internet",
  "due_date": "2026-06-20",
  "amount": 350000,
  "notes": null
}
```

Status default adalah `pending`.

### PUT `/api/reminders/:id`

Memperbarui sebagian data reminder atau menandainya sudah dibayar.

```json
{
  "status": "paid"
}
```

Server mengisi `paid_at` secara otomatis. Untuk mengembalikan reminder menjadi
belum dibayar:

```json
{
  "status": "pending"
}
```

### DELETE `/api/reminders/:id`

Menghapus reminder berdasarkan UUID.

```json
{
  "success": true
}
```

## Reports

### GET `/api/reports`

Mengambil laporan pada rentang tanggal.

| Param | Format | Default |
| --- | --- | --- |
| `from` | `YYYY-MM-DD` | Awal tahun berjalan |
| `to` | `YYYY-MM-DD` | Hari ini |
| `payment_method` | `cash` atau `non_cash` | Semua metode |

```http
GET /api/reports?from=2026-01-01&to=2026-06-30
```

Response:

```json
{
  "data": {
    "period": {
      "from": "2026-01-01",
      "to": "2026-06-30"
    },
    "summary": {
      "income": 30000000,
      "expense": 18000000,
      "net": 12000000
    },
    "byCategory": [],
    "monthly": []
  }
}
```

Request ditolak bila `from` lebih besar dari `to`.

## Export CSV

### GET `/api/export/csv`

Mengunduh transaksi dalam UTF-8 CSV dengan BOM agar nyaman dibuka di Excel.

Query params:

| Param | Format | Default |
| --- | --- | --- |
| `from` | `YYYY-MM-DD` | `2000-01-01` |
| `to` | `YYYY-MM-DD` | `2999-12-31` |
| `payment_method` | `cash` atau `non_cash` | Semua metode |

Kolom:

```text
Tanggal,Tipe,Deskripsi,Kategori,Metode Pembayaran,Wallet,Jumlah,Catatan
```

Response memiliki content type `text/csv` dan header `Content-Disposition`.

## Backup

### GET `/api/backup`

Mengambil seluruh data dalam format backup versi 1.

```json
{
  "version": 1,
  "exportedAt": "2026-06-07T10:00:00.000Z",
  "data": {
    "categories": [],
    "wallets": [],
    "transactions": [],
    "budgets": [],
    "wallet_transfers": [],
    "payment_reminders": []
  }
}
```

### POST `/api/backup/restore`

Memvalidasi backup lalu memanggil RPC PostgreSQL
`restore_finance_backup(payload)`.

Request body adalah JSON hasil `GET /api/backup`.

Response:

```json
{
  "success": true
}
```

Restore menghapus dan mengisi ulang seluruh tabel dalam satu transaksi. Jika
satu row gagal, seluruh operasi dibatalkan.

Backup JSON hanya menyimpan metadata lampiran. Binary gambar/PDF tetap berada
di bucket Supabase Storage dan tidak dipindahkan oleh restore JSON.

## Session PIN

Endpoint internal wajib memanggil:

```ts
await requirePinSession();
```

Jangan mengandalkan middleware saja. Pemeriksaan di route menjaga endpoint tetap
aman jika konfigurasi matcher berubah di masa mendatang.

## Contoh Error Validasi

```json
{
  "error": "Data tidak valid.",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "amount": ["Number must be greater than 0"]
    }
  }
}
```
