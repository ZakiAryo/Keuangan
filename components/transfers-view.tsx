"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ActionButton,
  EmptyState,
  Field,
  SectionHeader,
  SelectField,
  TextareaField,
} from "@/components/ui";
import type { Wallet, WalletTransfer } from "@/types/finance";

const today = new Date().toISOString().slice(0, 10);

export function TransfersView({
  wallets,
  transfers,
  refresh,
  notify,
}: {
  wallets: Wallet[];
  transfers: WalletTransfer[];
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}) {
  const [form, setForm] = useState({
    from_wallet_id: "",
    to_wallet_id: "",
    amount: "",
    fee: "0",
    transfer_date: today,
    notes: "",
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/api/transfers", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          fee: Number(form.fee || 0),
          notes: form.notes || null,
        }),
      });
      notify("Transfer berhasil dicatat.");
      setForm({
        from_wallet_id: "",
        to_wallet_id: "",
        amount: "",
        fee: "0",
        transfer_date: today,
        notes: "",
      });
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan transfer.", true);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus catatan transfer ini?")) return;
    try {
      await apiRequest(`/api/transfers?id=${id}`, { method: "DELETE" });
      notify("Transfer dihapus.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus.", true);
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Perpindahan dana"
        title="Transfer antar wallet"
        description="Transfer tidak dihitung sebagai pemasukan atau pengeluaran, tetapi langsung memengaruhi saldo wallet asal dan tujuan."
      />
      <form className="panel p-5" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Wallet asal"
            value={form.from_wallet_id}
            onChange={(event) =>
              setForm({ ...form, from_wallet_id: event.target.value })
            }
            required
          >
            <option value="">Pilih wallet asal</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({formatCurrency(wallet.balance ?? 0)})
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Wallet tujuan"
            value={form.to_wallet_id}
            onChange={(event) =>
              setForm({ ...form, to_wallet_id: event.target.value })
            }
            required
          >
            <option value="">Pilih wallet tujuan</option>
            {wallets
              .filter((wallet) => wallet.id !== form.from_wallet_id)
              .map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
          </SelectField>
          <Field
            label="Jumlah"
            type="number"
            min="1"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            required
          />
          <Field
            label="Biaya admin"
            type="number"
            min="0"
            value={form.fee}
            onChange={(event) => setForm({ ...form, fee: event.target.value })}
          />
          <Field
            label="Tanggal"
            type="date"
            value={form.transfer_date}
            onChange={(event) =>
              setForm({ ...form, transfer_date: event.target.value })
            }
            required
          />
          <TextareaField
            label="Catatan"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </div>
        <div className="mt-5 flex justify-end">
          <ActionButton
            variant="primary"
            type="submit"
            disabled={wallets.length < 2}
          >
            <Plus size={16} /> Catat transfer
          </ActionButton>
        </div>
      </form>

      <section className="panel mt-5 p-5">
        <h3 className="mb-4 font-semibold">Riwayat transfer</h3>
        <div className="space-y-2">
          {transfers.length ? (
            transfers.map((transfer) => (
              <article
                className="flex flex-col gap-4 rounded-xl border border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                key={transfer.id}
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{transfer.from_wallet?.name}</span>
                    <ArrowRight className="text-muted" size={15} />
                    <span>{transfer.to_wallet?.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(transfer.transfer_date)}
                    {Number(transfer.fee)
                      ? ` · Biaya ${formatCurrency(transfer.fee)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="font-semibold">{formatCurrency(transfer.amount)}</p>
                  <ActionButton
                    variant="danger"
                    onClick={() => remove(transfer.id)}
                  >
                    <Trash2 size={14} />
                  </ActionButton>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="Belum ada transfer"
              description="Catatan transfer antar wallet akan tampil di sini."
            />
          )}
        </div>
      </section>
    </>
  );
}
