# Security

## Kenapa Menggunakan PIN Gate

PIN gate dipilih karena aplikasi ditujukan untuk satu pemilik dan tidak
memerlukan akun, email, reset password, atau manajemen user. Pendekatan ini
menjaga setup tetap sederhana.

Setelah PIN benar, server membuat token session bertanda tangan HMAC SHA-256.
Token disimpan pada cookie:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` pada production
- Berlaku tujuh hari

PIN tidak disimpan di cookie maupun dikirim kembali ke browser.

## Batasan PIN Gate

PIN gate bukan pengganti sistem autentikasi multi-user. Sistem ini tidak
menyediakan:

- Identitas per pengguna.
- Role atau permission.
- Audit log per pengguna.
- Rate limiting terdistribusi.
- Reset PIN mandiri.
- Multi-factor authentication.

Siapa pun yang mengetahui URL dan PIN memiliki akses ke seluruh data.

## Penyimpanan Secret

Secret hanya disimpan pada environment variable:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=browser_safe
SUPABASE_SERVICE_ROLE_KEY=server_only
APP_PIN=server_only
PIN_SESSION_SECRET=server_only
```

`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` boleh tersedia
di browser. Anon key tidak memberi akses langsung ke bucket privat karena tidak
ada policy upload publik; browser hanya dapat upload memakai token signed yang
diterbitkan server setelah session PIN diverifikasi.

Jangan:

- Commit `.env.local`.
- Menaruh secret di screenshot, issue, atau log.
- Memberi prefix `NEXT_PUBLIC_` pada service role key, PIN, atau session secret.
- Mengirim service role key ke Client Component.
- Menggunakan secret development di production.

## Proteksi API

Endpoint internal dilindungi dua lapis:

1. `middleware.ts` menolak request tanpa session valid.
2. Route handler memanggil `requirePinSession()` sebelum query.

Semua body API divalidasi menggunakan Zod. UUID, tanggal, tipe transaksi,
nominal, dan panjang teks diperiksa sebelum masuk ke database.

## Supabase dan RLS

RLS diaktifkan pada seluruh tabel tanpa policy untuk `anon` atau
`authenticated`. Browser tidak memiliki Supabase anon client dan tidak dapat
mengakses tabel langsung.

Service role melewati RLS, sehingga key tersebut memiliki hak tinggi. Key hanya
boleh digunakan pada server route.

Bucket `transaction-attachments` bersifat privat. Browser tidak menerima public
URL atau service role key; file dibaca melalui route API setelah session PIN
diverifikasi. Upload dibatasi 10 MB dan server memvalidasi MIME serta signature
JPEG, PNG, WebP, atau PDF. Nama file asli hanya disimpan sebagai label, sedangkan
object path memakai UUID acak.

RPC restore:

- Menggunakan `SECURITY DEFINER`.
- Mengunci `search_path` ke `public`.
- Hak eksekusi dicabut dari `public`, `anon`, dan `authenticated`.
- Hanya diberikan kepada `service_role`.
- Menjalankan restore dalam satu transaksi.

## Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Tebak PIN | Gunakan PIN panjang dan URL privat; tambahkan rate limiting bila dipublikasikan |
| Cookie dicuri | HTTPS, HttpOnly, Secure, SameSite |
| Secret bocor | Environment variable, repository privat, rotasi key |
| Restore salah | Konfirmasi, validasi versi, backup sebelum restore |
| Akses database publik | RLS aktif tanpa policy publik |
| Input berbahaya | Zod dan query builder Supabase |

## Rotasi Credential

Jika PIN atau secret diduga bocor:

1. Ganti `APP_PIN`.
2. Ganti `PIN_SESSION_SECRET` untuk membatalkan seluruh session lama.
3. Rotasi service role key di Supabase bila key tersebut bocor.
4. Perbarui Vercel Environment Variables.
5. Redeploy.
6. Periksa data dan deployment logs.

## Upgrade ke Login/Auth

Untuk multi-user:

1. Aktifkan Supabase Auth.
2. Tambahkan `user_id` ke seluruh tabel.
3. Buat RLS policy berbasis `auth.uid()`.
4. Ganti service role CRUD dengan Supabase server client yang membawa session user.
5. Tambahkan halaman login, logout, reset password, dan verifikasi email.
6. Migrasikan data lama ke user pemilik.
7. Tambahkan audit trail untuk operasi sensitif.

PIN gate dapat dipertahankan sebagai lapisan tambahan, tetapi tidak boleh menjadi
satu-satunya identitas pada aplikasi multi-user.
