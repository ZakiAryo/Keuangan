"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import {
  ActionButton,
  EmptyState,
  Field,
  SectionHeader,
  SelectField,
} from "@/components/ui";
import type { Category, Wallet } from "@/types/finance";

const categoryEmpty = {
  name: "",
  type: "expense" as "income" | "expense",
  payment_method: "non_cash" as "cash" | "non_cash",
  color: "#70e1b0",
  icon: "",
};
const walletEmpty = {
  name: "",
  type: "Bank",
  initial_balance: "",
  color: "#60a5fa",
};

export function MasterDataView({
  categories,
  wallets,
  refresh,
  notify,
}: {
  categories: Category[];
  wallets: Wallet[];
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}) {
  const [category, setCategory] = useState(categoryEmpty);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categorySort, setCategorySort] = useState("name-asc");
  const [wallet, setWallet] = useState(walletEmpty);
  const [walletId, setWalletId] = useState<string | null>(null);
  const sortedCategories = useMemo(() => {
    return [...categories].sort((left, right) => {
      if (categorySort === "name-desc") {
        return right.name.localeCompare(left.name, "id-ID");
      }
      if (categorySort === "type") {
        return (
          left.type.localeCompare(right.type) ||
          left.name.localeCompare(right.name, "id-ID")
        );
      }
      if (categorySort === "payment") {
        return (
          left.payment_method.localeCompare(right.payment_method) ||
          left.name.localeCompare(right.name, "id-ID")
        );
      }
      if (categorySort === "newest") {
        return Date.parse(right.created_at) - Date.parse(left.created_at);
      }
      if (categorySort === "oldest") {
        return Date.parse(left.created_at) - Date.parse(right.created_at);
      }
      return left.name.localeCompare(right.name, "id-ID");
    });
  }, [categories, categorySort]);

  async function submitCategory(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest(
        categoryId ? `/api/categories/${categoryId}` : "/api/categories",
        {
          method: categoryId ? "PUT" : "POST",
          body: JSON.stringify({ ...category, icon: category.icon || null }),
        },
      );
      notify(categoryId ? "Kategori diperbarui." : "Kategori ditambahkan.");
      setCategory(categoryEmpty);
      setCategoryId(null);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan.", true);
    }
  }

  async function submitWallet(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest(walletId ? `/api/wallets/${walletId}` : "/api/wallets", {
        method: walletId ? "PUT" : "POST",
        body: JSON.stringify({
          ...wallet,
          initial_balance: Number(wallet.initial_balance || 0),
        }),
      });
      notify(walletId ? "Wallet diperbarui." : "Wallet ditambahkan.");
      setWallet(walletEmpty);
      setWalletId(null);
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan.", true);
    }
  }

  async function remove(kind: "categories" | "wallets", id: string) {
    const label = kind === "categories" ? "kategori" : "wallet";
    if (!window.confirm(`Hapus ${label} ini?`)) return;
    try {
      await apiRequest(`/api/${kind}/${id}`, { method: "DELETE" });
      notify(`${label[0].toUpperCase()}${label.slice(1)} dihapus.`);
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : `Gagal menghapus ${label}.`,
        true,
      );
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Konfigurasi"
        title="Kategori dan wallet"
        description="Kelola pengelompokan transaksi serta sumber dana yang dipakai untuk menghitung saldo."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold">
              {categoryId ? "Edit kategori" : "Tambah kategori"}
            </h3>
            {categoryId ? (
              <ActionButton
                onClick={() => {
                  setCategoryId(null);
                  setCategory(categoryEmpty);
                }}
              >
                <X size={14} /> Batal
              </ActionButton>
            ) : null}
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitCategory}>
            <Field
              label="Nama"
              value={category.name}
              onChange={(event) =>
                setCategory({ ...category, name: event.target.value })
              }
              required
            />
            <SelectField
              label="Tipe"
              value={category.type}
              onChange={(event) =>
                setCategory({
                  ...category,
                  type: event.target.value as "income" | "expense",
                })
              }
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </SelectField>
            <SelectField
              label="Metode pembayaran"
              value={category.payment_method}
              onChange={(event) =>
                setCategory({
                  ...category,
                  payment_method: event.target.value as "cash" | "non_cash",
                })
              }
            >
              <option value="cash">Cash</option>
              <option value="non_cash">Non-Cash</option>
            </SelectField>
            <Field
              label="Warna"
              type="color"
              value={category.color}
              onChange={(event) =>
                setCategory({ ...category, color: event.target.value })
              }
            />
            <Field
              label="Ikon (opsional)"
              value={category.icon}
              onChange={(event) =>
                setCategory({ ...category, icon: event.target.value })
              }
              placeholder="Contoh: food"
            />
            <ActionButton className="sm:col-span-2" variant="primary" type="submit">
              <Plus size={16} /> {categoryId ? "Simpan kategori" : "Tambah kategori"}
            </ActionButton>
          </form>
        </section>

        <section className="panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold">
              {walletId ? "Edit wallet" : "Tambah wallet"}
            </h3>
            {walletId ? (
              <ActionButton
                onClick={() => {
                  setWalletId(null);
                  setWallet(walletEmpty);
                }}
              >
                <X size={14} /> Batal
              </ActionButton>
            ) : null}
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitWallet}>
            <Field
              label="Nama"
              value={wallet.name}
              onChange={(event) =>
                setWallet({ ...wallet, name: event.target.value })
              }
              required
            />
            <SelectField
              label="Tipe"
              value={wallet.type}
              onChange={(event) =>
                setWallet({ ...wallet, type: event.target.value })
              }
            >
              <option>Bank</option>
              <option>Cash</option>
              <option>E-Wallet</option>
              <option>Investasi</option>
              <option>Lainnya</option>
            </SelectField>
            <Field
              label="Saldo awal"
              type="number"
              min="0"
              value={wallet.initial_balance}
              onChange={(event) =>
                setWallet({ ...wallet, initial_balance: event.target.value })
              }
            />
            <Field
              label="Warna"
              type="color"
              value={wallet.color}
              onChange={(event) =>
                setWallet({ ...wallet, color: event.target.value })
              }
            />
            <ActionButton className="sm:col-span-2" variant="primary" type="submit">
              <Plus size={16} /> {walletId ? "Simpan wallet" : "Tambah wallet"}
            </ActionButton>
          </form>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="panel p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">Daftar kategori</h3>
            <select
              className="field h-9 w-full sm:w-48"
              value={categorySort}
              onChange={(event) => setCategorySort(event.target.value)}
              aria-label="Urutkan kategori"
            >
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
              <option value="type">Tipe transaksi</option>
              <option value="payment">Cash / Non-Cash</option>
              <option value="newest">Terbaru dibuat</option>
              <option value="oldest">Terlama dibuat</option>
            </select>
          </div>
          <div className="space-y-2">
            {categories.length ? (
              sortedCategories.map((item) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
                  key={item.id}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted">
                        {item.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        {" · "}
                        {item.payment_method === "cash" ? "Cash" : "Non-Cash"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      onClick={() => {
                        setCategoryId(item.id);
                        setCategory({
                          name: item.name,
                          type: item.type,
                          payment_method: item.payment_method,
                          color: item.color,
                          icon: item.icon ?? "",
                        });
                      }}
                    >
                      <Pencil size={14} />
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => remove("categories", item.id)}
                    >
                      <Trash2 size={14} />
                    </ActionButton>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Belum ada kategori"
                description="Buat kategori pemasukan dan pengeluaran."
              />
            )}
          </div>
        </section>

        <section className="panel p-5">
          <h3 className="mb-4 font-semibold">Daftar wallet</h3>
          <div className="space-y-2">
            {wallets.length ? (
              wallets.map((item) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
                  key={item.id}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-9 w-1 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted">
                        {item.type} · {formatCurrency(item.balance ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      onClick={() => {
                        setWalletId(item.id);
                        setWallet({
                          name: item.name,
                          type: item.type,
                          initial_balance: String(item.initial_balance),
                          color: item.color,
                        });
                      }}
                    >
                      <Pencil size={14} />
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => remove("wallets", item.id)}
                    >
                      <Trash2 size={14} />
                    </ActionButton>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Belum ada wallet"
                description="Tambahkan rekening bank, cash, atau e-wallet."
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
