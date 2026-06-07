# Deployment ke Vercel

## Persiapan Repository GitHub

1. Buat repository GitHub privat.
2. Pastikan `.env.local` tidak masuk ke Git.
3. Jalankan pemeriksaan lokal.

```bash
npm run typecheck
npm run lint
npm run build
```

4. Commit source code dan push.

Jika deployment memakai database lama, jalankan migration
`supabase/migrations/20260607_add_category_payment_method.sql` di SQL Editor
Supabase sebelum deployment baru dipromosikan ke production.

Jalankan juga `supabase/migrations/20260607_add_transaction_attachments.sql`
untuk membuat kolom lampiran dan bucket Storage privat.

Jalankan `supabase/migrations/20260607_add_payment_reminders.sql` untuk
mengaktifkan reminder tagihan dan memperbarui fungsi backup/restore.

Jalankan `supabase/migrations/20260607_update_budget_date_range.sql` untuk
mengaktifkan budget berbasis rentang tanggal. Jalankan setelah migration
reminder agar fungsi restore memakai versi terbaru.

```bash
git add .
git commit -m "Create personal finance tracker"
git push origin main
```

## Import ke Vercel

1. Masuk ke dashboard Vercel.
2. Pilih **Add New > Project**.
3. Hubungkan akun GitHub.
4. Import repository.
5. Framework preset akan terdeteksi sebagai **Next.js**.
6. Gunakan build command `npm run build`.

## Environment Variables Vercel

Tambahkan variable berikut untuk environment **Production**:

| Name | Nilai |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase |
| `APP_PIN` | PIN production |
| `PIN_SESSION_SECRET` | Secret acak production |

Jika Preview Deployment akan dipakai, tambahkan variable ke environment
**Preview** juga. Gunakan PIN dan secret yang berbeda jika memungkinkan.

Setiap perubahan environment variable memerlukan redeploy agar terbaca oleh
deployment baru.

## Deploy

Klik **Deploy** dan tunggu build selesai. Bila build gagal, buka build logs dan
bandingkan dengan hasil `npm run build` lokal.

## Checklist Setelah Deploy

- Halaman root mengarahkan pengguna ke `/pin`.
- PIN salah menghasilkan pesan error dan status `401`.
- PIN benar mengarahkan pengguna ke dashboard.
- Cookie session memiliki flag `HttpOnly`, `Secure`, dan `SameSite=Lax`.
- Kategori dapat dibuat.
- Kategori dapat diklasifikasikan sebagai Cash atau Non-Cash.
- Daftar kategori dapat diurutkan.
- Wallet dapat dibuat.
- Transaksi dapat dibuat dan saldo berubah.
- Transfer memengaruhi wallet asal dan tujuan.
- Budget dapat memakai rentang tanggal bebas dan menghitung Cash/Non-Cash secara akumulasi.
- Reminder dapat dibuat, diedit, ditandai lunas, dan muncul di dashboard.
- Laporan dan export CSV bekerja.
- Filter Cash/Non-Cash bekerja pada transaksi, laporan, dan CSV.
- Upload, preview, download, ganti, dan hapus lampiran transaksi bekerja.
- Backup JSON dapat diunduh.
- Logout menghapus session.

## Test PIN Gate dan API

Tanpa cookie, endpoint internal harus menolak request:

```bash
curl -i https://your-app.vercel.app/api/dashboard
```

Response yang diharapkan:

```http
HTTP/2 401
content-type: application/json

{"error":"Sesi PIN tidak valid atau sudah berakhir."}
```

Test auth:

```bash
curl -i \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"pin":"your_pin"}' \
  https://your-app.vercel.app/api/auth-pin
```

Header response harus berisi `Set-Cookie`. Jangan menaruh PIN dalam command
history pada komputer bersama.

## Domain dan Akses

- Gunakan repository privat.
- Jangan membagikan URL deployment.
- Custom domain bersifat opsional.
- HTTPS disediakan otomatis oleh Vercel.
- Untuk akses multi-user, upgrade ke autentikasi pengguna sebelum membagikan app.

## Rollback

Jika deployment baru bermasalah:

1. Buka tab **Deployments** di Vercel.
2. Pilih deployment terakhir yang stabil.
3. Gunakan **Promote to Production**.
4. Jangan menjalankan restore database kecuali masalah terkait data.
