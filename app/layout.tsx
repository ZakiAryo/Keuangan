import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Finance Tracker",
  description:
    "Aplikasi keuangan pribadi untuk mencatat transaksi, budget, wallet, dan laporan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="font-sans">{children}</body>
    </html>
  );
}
