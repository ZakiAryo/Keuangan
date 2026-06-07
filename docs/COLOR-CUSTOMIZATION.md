# Panduan Mengganti Warna

Dokumen ini menjelaskan lokasi warna utama aplikasi agar tema dapat diubah tanpa
mencari kode warna di banyak komponen.

## Ringkasan Lokasi

| Kebutuhan | File atau menu |
| --- | --- |
| Warna tema global Tailwind | `tailwind.config.ts` |
| Warna chart dan tooltip | `lib/chart-theme.ts` |
| Style input, tombol, dan panel | `app/globals.css` |
| Warna kategori transaksi | **Data utama > Kategori** |

## Mengganti Warna Tema Global

Buka `tailwind.config.ts`, lalu ubah nilai pada `theme.extend.colors`.

```ts
colors: {
  background: "#070b12",
  panel: "#0d1420",
  line: "#1c2838",
  muted: "#8b9bb0",
  accent: "#70e1b0",
  danger: "#fb7185",
}
```

Fungsi setiap token:

| Token | Penggunaan |
| --- | --- |
| `background` | Latar utama halaman |
| `panel` | Card, dialog, sidebar, dan tooltip |
| `line` | Border, divider, dan grid chart |
| `muted` | Teks sekunder dan label sumbu |
| `accent` | Tombol utama, status aktif, dan pemasukan |
| `danger` | Error, pengeluaran, dan aksi berbahaya |

Utility seperti `bg-panel`, `text-accent`, dan `border-line` otomatis mengikuti
nilai baru.

## Mengganti Warna Chart

Warna chart statis dan tooltip dipusatkan di `lib/chart-theme.ts`.

```ts
export const CHART_COLORS = {
  income: "#70e1b0",
  expense: "#fb7185",
  grid: "#1c2838",
  muted: "#8b9bb0",
  tooltipBackground: "#0d1420",
  tooltipBorder: "#1c2838",
  tooltipText: "#ffffff",
} as const;
```

Contoh:

- Ubah `income` untuk warna garis atau bar pemasukan.
- Ubah `expense` untuk warna garis atau bar pengeluaran.
- Ubah `tooltipBackground` untuk latar kotak saat chart di-hover.
- Ubah `tooltipText` untuk teks label dan nilai saat chart di-hover.

Tooltip dashboard dan laporan menggunakan konfigurasi yang sama:

```tsx
<Tooltip
  contentStyle={chartTooltipContentStyle}
  labelStyle={chartTooltipTextStyle}
  itemStyle={chartTooltipTextStyle}
/>
```

Jangan menghapus `labelStyle` atau `itemStyle`. Recharts dapat memakai warna teks
default browser yang gelap dan sulit dibaca pada tooltip dark mode.

## Warna Donut Chart

Warna setiap potongan donut berasal dari kolom `categories.color` di database.
Ubah melalui form kategori pada menu **Data utama**. Perubahan akan dipakai pada
dashboard dan laporan tanpa mengubah source code.

Warna teks tooltip donut berasal dari `CHART_COLORS.tooltipText`.

## Mengganti Style Komponen

Class reusable seperti `.input`, `.btn-primary`, dan `.panel` berada di
`app/globals.css`. Gunakan token Tailwind agar tema tetap konsisten.

```css
.btn-primary {
  @apply bg-accent text-slate-950;
}
```

Jika satu warna digunakan berulang kali, tambahkan token di
`tailwind.config.ts` atau `lib/chart-theme.ts`. Hindari menyebarkan kode hex yang
sama ke banyak komponen.

## Rekomendasi Keterbacaan

- Gunakan teks terang pada latar gelap.
- Pertahankan rasio kontras minimal 4.5:1 untuk teks normal.
- Periksa state normal, hover, focus, disabled, dan error.
- Pastikan warna kategori yang berdampingan dapat dibedakan.

## Menjalankan dan Memeriksa Perubahan

```bash
npm run dev
```

Buka `http://localhost:3000`, lalu periksa dashboard, laporan, tooltip chart,
form, dialog, dan tampilan mobile.

Sebelum deploy:

```bash
npm run typecheck
npm run lint
npm run build
```

Push perubahan ke repository agar Vercel melakukan deployment ulang.
