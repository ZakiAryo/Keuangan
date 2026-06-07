# UI Guide

## Prinsip Desain

Antarmuka menggunakan dark premium UI yang tenang, padat informasi, dan tetap
mudah dipakai pada layar kecil. Aksi utama memakai warna hijau mint, sedangkan
aksi destruktif memakai warna merah.

## Theme Color

| Token | Warna | Penggunaan |
| --- | --- | --- |
| Background | `#070b12` | Latar utama |
| Panel | `#0d1420` | Card dan sidebar |
| Line | `#1c2838` | Border dan divider |
| Muted | `#8b9bb0` | Teks sekunder |
| Accent | `#70e1b0` | Aksi utama dan pemasukan |
| Danger | `#fb7185` | Pengeluaran, error, hapus |

Token tersedia di `tailwind.config.ts` dan class komponen global tersedia pada
`app/globals.css`.

Panduan lokasi warna, chart, tooltip, dan proses pengujiannya tersedia di
[`COLOR-CUSTOMIZATION.md`](./COLOR-CUSTOMIZATION.md).

## Layout Desktop

- Sidebar tetap selebar 248 px.
- Konten utama memiliki lebar maksimum 1440 px.
- Summary card memakai grid empat kolom pada layar lebar.
- Chart dashboard memakai pembagian area sekitar 60/40.
- Tabel transaksi ditampilkan pada breakpoint `md` ke atas.

## Layout Tablet

- Grid berubah menjadi dua kolom.
- Form menggunakan dua kolom jika ruang cukup.
- Chart tetap responsif dan tidak memakai lebar statis.
- Sidebar hanya tampil pada breakpoint `lg`.

## Layout Mobile

- Navigasi utama berada di bawah layar.
- Konten memiliki padding yang cukup agar tidak tertutup bottom navigation.
- Daftar transaksi berubah menjadi card.
- Form berubah menjadi satu kolom.
- Tombol aksi tetap memiliki area sentuh yang memadai.

## Komponen Utama

### Panel

Gunakan class `panel` untuk card utama:

```tsx
<section className="panel p-5">...</section>
```

### Field

Gunakan komponen `Field`, `SelectField`, dan `TextareaField` dari
`components/ui.tsx` agar label, warna, focus state, dan ukuran konsisten.

Form kategori menyediakan klasifikasi **Cash** dan **Non-Cash**. Form transaksi
meminta metode pembayaran lebih dahulu, lalu hanya menampilkan kategori yang
sesuai. Riwayat transaksi dan laporan menampilkan metode sebagai label sekunder
dan menyediakan filter metode pembayaran.

Form transaksi juga menyediakan drop area lampiran opsional. Tombol detail pada
setiap transaksi membuka dialog berisi informasi lengkap, preview gambar/PDF,
unduh, hapus lampiran, dan shortcut edit. Daftar kategori memiliki sorting nama,
tipe, metode pembayaran, serta waktu pembuatan.

Halaman reminder memakai badge merah untuk tagihan terlambat, kuning untuk
jatuh tempo hari ini, hijau untuk tagihan lunas, dan warna netral untuk tagihan
yang masih akan datang. Navigasi mobile dapat digeser horizontal agar seluruh
menu tetap memiliki area sentuh yang nyaman.

Form budget memakai tanggal awal dan tanggal akhir, bukan input bulan. Opsi
kategori budget digabung berdasarkan nama kategori sehingga Cash dan Non-Cash
tidak tampil sebagai pilihan terpisah.

### Button

- `primary`: simpan atau aksi utama.
- `secondary`: filter, batal, dan aksi netral.
- `danger`: hapus atau aksi destruktif.

### Chart

Semua chart harus berada dalam `ResponsiveContainer`. Tooltip memakai background
panel, border line, dan teks putih agar terbaca di dark mode. Warna chart statis
dipusatkan di `lib/chart-theme.ts`, sedangkan warna donut mengikuti warna
kategori dari database.

## Responsive Behavior

- Hindari width pixel tetap pada konten.
- Gunakan `overflow-x-auto` untuk tabel bila perlu.
- Gunakan card mobile untuk data yang memiliki banyak kolom penting.
- Angka uang tidak boleh terpotong; gunakan `whitespace-nowrap` bila perlu.
- Form panjang dipecah menjadi grid yang runtuh secara bertahap.

## Empty State

Empty state harus menjelaskan:

1. Data apa yang belum tersedia.
2. Aksi apa yang perlu dilakukan.

Contoh:

```tsx
<EmptyState
  title="Belum ada wallet"
  description="Tambahkan rekening bank, cash, atau e-wallet."
/>
```

## Loading State

- Dashboard menggunakan skeleton.
- Tombol submit menampilkan teks proses dan dinonaktifkan.
- Jangan mengosongkan data lama saat refresh; perbarui setelah request berhasil.
- Error load utama ditampilkan sebagai panel dengan tombol **Coba lagi**.

## Toast dan Dialog

- Toast sukses memakai accent.
- Toast error memakai danger.
- Toast menghilang otomatis setelah empat detik.
- Operasi hapus harus meminta konfirmasi.
- Restore harus memberi peringatan bahwa seluruh data akan diganti.

Untuk aplikasi yang berkembang lebih besar, `window.confirm` dapat diganti
dengan dialog aksesibel yang memiliki focus trap.
