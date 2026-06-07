"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { ATTACHMENT_BUCKET } from "@/lib/attachment-config";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
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
  payment_method: "non_cash" as "cash" | "non_cash",
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [detailTransaction, setDetailTransaction] =
    useState<Transaction | null>(null);
  const [filter, setFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const availableCategories = categories.filter(
    (category) =>
      category.type === form.type &&
      category.payment_method === form.payment_method,
  );
  const visibleTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          (filter === "all" || transaction.type === filter) &&
          (paymentFilter === "all" ||
            transaction.category?.payment_method === paymentFilter),
      ),
    [filter, paymentFilter, transactions],
  );

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setAttachmentFile(null);
    setFileInputKey((value) => value + 1);
  }

  function edit(transaction: Transaction) {
    setEditingId(transaction.id);
    setAttachmentFile(null);
    setFileInputKey((value) => value + 1);
    setForm({
      type: transaction.type,
      amount: String(transaction.amount),
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      payment_method: transaction.category?.payment_method ?? "non_cash",
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
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        transaction_date: form.transaction_date,
        category_id: form.category_id,
        wallet_id: form.wallet_id,
        notes: form.notes || null,
      };
      const transactionResult = await apiRequest<{ data: Transaction }>(
        editingId ? `/api/transactions/${editingId}` : "/api/transactions",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      let attachmentFailed = false;
      if (attachmentFile) {
        try {
          const uploadPermission = await apiRequest<{
            data: { path: string; token: string };
          }>(
            `/api/transactions/${transactionResult.data.id}/attachment`,
            {
              method: "POST",
              body: JSON.stringify({
                name: attachmentFile.name,
                type: attachmentFile.type,
                size: attachmentFile.size,
              }),
            },
          );
          const uploadResult = await getSupabaseBrowser().storage
            .from(ATTACHMENT_BUCKET)
            .uploadToSignedUrl(
              uploadPermission.data.path,
              uploadPermission.data.token,
              attachmentFile,
              {
                contentType: attachmentFile.type,
                cacheControl: "3600",
              },
            );
          if (uploadResult.error) {
            throw new Error(uploadResult.error.message);
          }
          await apiRequest(
            `/api/transactions/${transactionResult.data.id}/attachment`,
            {
              method: "PUT",
              body: JSON.stringify({
                path: uploadPermission.data.path,
                name: attachmentFile.name,
                type: attachmentFile.type,
                size: attachmentFile.size,
              }),
            },
          );
        } catch (error) {
          attachmentFailed = true;
          notify(
            `Transaksi tersimpan, tetapi lampiran gagal diupload: ${
              error instanceof Error ? error.message : "Upload gagal."
            }`,
            true,
          );
        }
      }

      if (!attachmentFailed) {
        notify(
          editingId ? "Transaksi diperbarui." : "Transaksi ditambahkan.",
        );
      }
      reset();
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan.", true);
    } finally {
      setSaving(false);
    }
  }

  function chooseAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setAttachmentFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify("Ukuran lampiran maksimal 10 MB.", true);
      event.target.value = "";
      setAttachmentFile(null);
      return;
    }
    setAttachmentFile(file);
  }

  async function removeAttachment(transaction: Transaction) {
    if (!window.confirm("Hapus lampiran transaksi ini?")) return;
    try {
      await apiRequest(`/api/transactions/${transaction.id}/attachment`, {
        method: "DELETE",
      });
      setDetailTransaction(null);
      notify("Lampiran dihapus.");
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Gagal menghapus lampiran.",
        true,
      );
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
            label="Metode pembayaran"
            value={form.payment_method}
            onChange={(event) =>
              setForm({
                ...form,
                payment_method: event.target.value as "cash" | "non_cash",
                category_id: "",
              })
            }
          >
            <option value="cash">Cash</option>
            <option value="non_cash">Non-Cash</option>
          </SelectField>
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
          <label className="block md:col-span-2">
            <span className="label">Struk atau bukti transaksi (opsional)</span>
            <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-[#09101a] px-4 py-4 text-center transition hover:border-accent/50">
              <Upload className="mb-2 text-accent" size={20} />
              <span className="text-sm font-medium text-slate-200">
                {attachmentFile
                  ? attachmentFile.name
                  : "Pilih foto atau PDF"}
              </span>
              <span className="mt-1 text-xs text-muted">
                JPEG, PNG, WebP, atau PDF · maksimal 10 MB
              </span>
              <input
                key={fileInputKey}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={chooseAttachment}
              />
            </span>
            {editingId &&
            transactions.find((transaction) => transaction.id === editingId)
              ?.attachment_name ? (
              <span className="mt-2 flex items-center gap-2 text-xs text-muted">
                <Paperclip size={13} />
                File baru akan mengganti lampiran{" "}
                {
                  transactions.find(
                    (transaction) => transaction.id === editingId,
                  )?.attachment_name
                }
                .
              </span>
            ) : null}
          </label>
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="field h-9 w-full sm:w-44"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Semua tipe</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
            <select
              className="field h-9 w-full sm:w-44"
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
            >
              <option value="all">Cash & Non-Cash</option>
              <option value="cash">Cash</option>
              <option value="non_cash">Non-Cash</option>
            </select>
          </div>
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
                        <span className="flex items-center gap-2">
                          {transaction.description}
                          {transaction.attachment_path ? (
                            <Paperclip
                              className="shrink-0 text-accent"
                              size={14}
                            />
                          ) : null}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted">
                        {transaction.category?.name}
                        <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide">
                          {transaction.category?.payment_method === "cash"
                            ? "Cash"
                            : "Non-Cash"}
                        </span>
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
                            aria-label="Lihat detail transaksi"
                            onClick={() => setDetailTransaction(transaction)}
                          >
                            <Eye size={14} />
                          </ActionButton>
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
                        {transaction.attachment_path ? (
                          <Paperclip
                            className="ml-2 inline text-accent"
                            size={13}
                          />
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {transaction.category?.name} ·{" "}
                        {transaction.category?.payment_method === "cash"
                          ? "Cash"
                          : "Non-Cash"}{" "}
                        · {transaction.wallet?.name}
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
                      <ActionButton
                        onClick={() => setDetailTransaction(transaction)}
                      >
                        <Eye size={14} />
                      </ActionButton>
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

      {detailTransaction ? (
        <TransactionDetailModal
          transaction={detailTransaction}
          onClose={() => setDetailTransaction(null)}
          onEdit={() => {
            setDetailTransaction(null);
            edit(detailTransaction);
          }}
          onRemoveAttachment={() => void removeAttachment(detailTransaction)}
        />
      ) : null}
    </>
  );
}

function TransactionDetailModal({
  transaction,
  onClose,
  onEdit,
  onRemoveAttachment,
}: {
  transaction: Transaction;
  onClose: () => void;
  onEdit: () => void;
  onRemoveAttachment: () => void;
}) {
  const attachmentUrl = `/api/transactions/${transaction.id}/attachment`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Detail transaksi"
    >
      <section className="panel max-h-[92vh] w-full max-w-3xl overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Detail transaksi
            </p>
            <h3 className="mt-1 font-semibold">{transaction.description}</h3>
          </div>
          <ActionButton aria-label="Tutup detail" onClick={onClose}>
            <X size={16} />
          </ActionButton>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <DetailItem
            label="Tipe"
            value={transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
          />
          <DetailItem
            label="Jumlah"
            value={formatCurrency(transaction.amount)}
          />
          <DetailItem label="Kategori" value={transaction.category?.name ?? "-"} />
          <DetailItem
            label="Metode pembayaran"
            value={
              transaction.category?.payment_method === "cash"
                ? "Cash"
                : "Non-Cash"
            }
          />
          <DetailItem label="Wallet" value={transaction.wallet?.name ?? "-"} />
          <DetailItem
            label="Tanggal"
            value={formatDate(transaction.transaction_date)}
          />
          <div className="sm:col-span-2">
            <DetailItem label="Catatan" value={transaction.notes || "-"} />
          </div>
        </div>

        <div className="border-t border-line p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="flex items-center gap-2 font-semibold">
                <FileText className="text-accent" size={17} />
                Lampiran
              </h4>
              {transaction.attachment_name ? (
                <p className="mt-1 text-xs text-muted">
                  {transaction.attachment_name} ·{" "}
                  {formatFileSize(transaction.attachment_size)}
                </p>
              ) : null}
            </div>
            {transaction.attachment_path ? (
              <div className="flex flex-wrap gap-2">
                <a
                  className="btn-secondary"
                  href={`${attachmentUrl}?download=1`}
                >
                  <Download size={15} /> Unduh
                </a>
                <ActionButton variant="danger" onClick={onRemoveAttachment}>
                  <Trash2 size={14} /> Hapus lampiran
                </ActionButton>
              </div>
            ) : null}
          </div>

          {transaction.attachment_path && transaction.attachment_type ? (
            <object
              className="h-[55vh] min-h-80 w-full rounded-xl border border-line bg-white"
              data={attachmentUrl}
              type={transaction.attachment_type}
            >
              <div className="p-6 text-center text-sm text-slate-900">
                Preview tidak didukung browser. Gunakan tombol Unduh.
              </div>
            </object>
          ) : (
            <div className="rounded-xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
              Transaksi ini tidak memiliki lampiran.
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <ActionButton onClick={onClose}>Tutup</ActionButton>
          <ActionButton variant="primary" onClick={onEdit}>
            <Pencil size={15} /> Edit transaksi
          </ActionButton>
        </footer>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function formatFileSize(size: number | null) {
  if (!size) return "Ukuran tidak tersedia";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
