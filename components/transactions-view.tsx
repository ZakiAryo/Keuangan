"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
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
import type { Category, Transaction, Wallet } from "@/types/finance";

const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  type: "expense" as "income" | "expense",
  amount: "",
  description: "",
  transaction_date: today,
  category_id: "",
  wallet_id: "",
  notes: "",
};

export function TransactionsView({
  transactions,
  categories,
  wallets,
  refresh,
  notify,
}: {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const availableCategories = categories.filter(
    (category) => category.type === form.type,
  );
  const visibleTransactions = useMemo(
    () =>
      filter === "all"
        ? transactions
        : transactions.filter((transaction) => transaction.type === filter),
    [filter, transactions],
  );

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(transaction: Transaction) {
    setEditingId(transaction.id);
    setForm({
      type: transaction.type,
      amount: String(transaction.amount),
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      category_id: transaction.category_id,
      wallet_id: transaction.wallet_id,
      notes: transaction.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiRequest(
        editingId ? `/api/transactions/${editingId}` : "/api/transactions",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            amount: Number(form.amount),
            notes: form.notes || null,
          }),
        },
      );
      notify(editingId ? "Transaksi diperbarui." : "Transaksi ditambahkan.");
      reset();
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan.", true);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus transaksi ini?")) return;
    try {
      await apiRequest(`/api/transactions/${id}`, { method: "DELETE" });
      notify("Transaksi dihapus.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus.", true);
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Pencatatan"
        title="Manajemen transaksi"
        description="Catat pemasukan dan pengeluaran. Saldo wallet diperbarui dari seluruh transaksi secara otomatis."
      />

      <form className="panel mb-5 p-5" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold">
            {editingId ? "Edit transaksi" : "Transaksi baru"}
          </h3>
          {editingId ? (
            <ActionButton type="button" onClick={reset}>
              <X size={15} /> Batal
            </ActionButton>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Tipe"
            value={form.type}
            onChange={(event) =>
              setForm({
                ...form,
                type: event.target.value as "income" | "expense",
                category_id: "",
              })
            }
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </SelectField>
          <Field
            label="Jumlah"
            type="number"
            min="1"
            step="1"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            required
          />
          <Field
            label="Tanggal"
            type="date"
            value={form.transaction_date}
            onChange={(event) =>
              setForm({ ...form, transaction_date: event.target.value })
            }
            required
          />
          <Field
            label="Deskripsi"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Contoh: Belanja bulanan"
            required
          />
          <SelectField
            label="Kategori"
            value={form.category_id}
            onChange={(event) =>
              setForm({ ...form, category_id: event.target.value })
            }
            required
          >
            <option value="">Pilih kategori</option>
            {availableCategories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Wallet"
            value={form.wallet_id}
            onChange={(event) =>
              setForm({ ...form, wallet_id: event.target.value })
            }
            required
          >
            <option value="">Pilih wallet</option>
            {wallets.map((wallet) => (
              <option value={wallet.id} key={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </SelectField>
          <div className="md:col-span-2">
            <TextareaField
              label="Catatan opsional"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              placeholder="Detail tambahan transaksi"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <ActionButton
            variant="primary"
            type="submit"
            disabled={saving || !categories.length || !wallets.length}
          >
            <Plus size={17} />
            {saving ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Tambah transaksi"}
          </ActionButton>
        </div>
      </form>

      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold">Riwayat transaksi</h3>
          <select
            className="field h-9 w-full sm:w-44"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Semua tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>
        {visibleTransactions.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3">Transaksi</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Wallet</th>
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3 text-right">Jumlah</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-5 py-4 font-medium">
                        {transaction.description}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {transaction.category?.name}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {transaction.wallet?.name}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          transaction.type === "income"
                            ? "text-accent"
                            : "text-danger"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            aria-label="Edit transaksi"
                            onClick={() => edit(transaction)}
                          >
                            <Pencil size={14} />
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            aria-label="Hapus transaksi"
                            onClick={() => remove(transaction.id)}
                          >
                            <Trash2 size={14} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-line md:hidden">
              {visibleTransactions.map((transaction) => (
                <article className="p-4" key={transaction.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {transaction.description}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {transaction.category?.name} · {transaction.wallet?.name}
                      </p>
                    </div>
                    <p
                      className={
                        transaction.type === "income"
                          ? "text-sm font-semibold text-accent"
                          : "text-sm font-semibold text-danger"
                      }
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted">
                      {formatDate(transaction.transaction_date)}
                    </span>
                    <div className="flex gap-2">
                      <ActionButton onClick={() => edit(transaction)}>
                        <Pencil size={14} />
                      </ActionButton>
                      <ActionButton
                        variant="danger"
                        onClick={() => remove(transaction.id)}
                      >
                        <Trash2 size={14} />
                      </ActionButton>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Belum ada transaksi"
              description="Tambahkan kategori dan wallet, lalu catat transaksi pertama Anda."
            />
          </div>
        )}
      </section>
    </>
  );
}
