"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Download, LogOut, ShieldCheck, Upload } from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { ActionButton, SectionHeader } from "@/components/ui";
import type { BackupData } from "@/types/finance";

export function DataToolsView({
  notify,
  onLogout,
  refresh,
}: {
  notify: (message: string, error?: boolean) => void;
  onLogout: () => void;
  refresh: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  async function backup() {
    try {
      const data = await apiRequest<BackupData>("/api/backup");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify("Backup JSON berhasil dibuat.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal membuat backup.", true);
    }
  }

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !window.confirm(
        "Restore akan mengganti seluruh data saat ini. Pastikan Anda sudah membuat backup. Lanjutkan?",
      )
    ) {
      return;
    }

    setRestoring(true);
    try {
      const payload = JSON.parse(await file.text()) as BackupData;
      await apiRequest("/api/backup/restore", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      notify("Data berhasil direstore.");
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "File backup tidak valid.",
        true,
      );
    } finally {
      setRestoring(false);
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Pemeliharaan"
        title="Backup dan keamanan"
        description="Unduh salinan lengkap data Anda atau pulihkan data dari backup JSON yang dibuat aplikasi."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-6">
          <Download className="mb-5 text-accent" size={26} />
          <h3 className="font-semibold">Backup JSON</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Backup berisi kategori, wallet, transaksi, budget, dan transfer.
            Simpan file di lokasi yang aman.
          </p>
          <ActionButton className="mt-5" variant="primary" onClick={backup}>
            <Download size={16} /> Unduh backup
          </ActionButton>
        </section>

        <section className="panel p-6">
          <Upload className="mb-5 text-amber-300" size={26} />
          <h3 className="font-semibold">Restore JSON</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Restore mengganti seluruh data saat ini dalam satu transaksi
            database. Gunakan hanya file backup versi yang didukung.
          </p>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="application/json,.json"
            onChange={restore}
          />
          <ActionButton
            className="mt-5"
            onClick={() => inputRef.current?.click()}
            disabled={restoring}
          >
            <Upload size={16} /> {restoring ? "Memulihkan..." : "Pilih file backup"}
          </ActionButton>
        </section>
      </div>

      <section className="panel mt-5 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-accent" size={24} />
            <div>
              <h3 className="font-semibold">Session PIN</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                Aplikasi ini ditujukan untuk penggunaan pribadi. Jangan bagikan
                URL maupun PIN, dan gunakan autentikasi pengguna jika akan
                dipakai oleh banyak orang.
              </p>
            </div>
          </div>
          <ActionButton onClick={onLogout}>
            <LogOut size={16} /> Keluar dari aplikasi
          </ActionButton>
        </div>
      </section>
    </>
  );
}
