"use client";

import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import {
  ActionButton,
  EmptyState,
  Field,
  SectionHeader,
  SelectField,
} from "@/components/ui";
import type { Budget, Category } from "@/types/finance";

const currentMonth = new Date().toISOString().slice(0, 7);

export function BudgetsView({
  budgets,
  categories,
  refresh,
  notify,
}: {
  budgets: Budget[];
  categories: Category[];
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}) {
  const [form, setForm] = useState({
    category_id: "",
    month: currentMonth,
    amount: "",
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          category_id: form.category_id,
          month: `${form.month}-01`,
          amount: Number(form.amount),
        }),
      });
      notify("Budget disimpan.");
      setForm({ ...form, category_id: "", amount: "" });
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menyimpan budget.", true);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus budget ini?")) return;
    try {
      await apiRequest(`/api/budgets/${id}`, { method: "DELETE" });
      notify("Budget dihapus.");
      await refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal menghapus.", true);
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Kontrol pengeluaran"
        title="Budget bulanan"
        description="Tetapkan batas per kategori pengeluaran. Menyimpan kategori dan bulan yang sama akan memperbarui budget sebelumnya."
      />
      <form className="panel p-5" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Kategori pengeluaran"
            value={form.category_id}
            onChange={(event) =>
              setForm({ ...form, category_id: event.target.value })
            }
            required
          >
            <option value="">Pilih kategori</option>
            {categories
              .filter((category) => category.type === "expense")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </SelectField>
          <Field
            label="Bulan"
            type="month"
            value={form.month}
            onChange={(event) => setForm({ ...form, month: event.target.value })}
            required
          />
          <Field
            label="Nominal budget"
            type="number"
            min="1"
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
            required
          />
        </div>
        <div className="mt-5 flex justify-end">
          <ActionButton variant="primary" type="submit">
            <Plus size={16} /> Simpan budget
          </ActionButton>
        </div>
      </form>

      <section className="panel mt-5 p-5">
        <h3 className="mb-4 font-semibold">Daftar budget</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {budgets.length ? (
            budgets.map((budget) => {
              const spent = Number(budget.spent ?? 0);
              const amount = Number(budget.amount);
              const percentage = amount ? (spent / amount) * 100 : 0;
              return (
                <article className="rounded-xl border border-line p-4" key={budget.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{budget.category?.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Intl.DateTimeFormat("id-ID", {
                          month: "long",
                          year: "numeric",
                        }).format(new Date(budget.month))}
                      </p>
                    </div>
                    <ActionButton
                      variant="danger"
                      onClick={() => remove(budget.id)}
                    >
                      <Trash2 size={14} />
                    </ActionButton>
                  </div>
                  <div className="mt-5 flex justify-between text-xs">
                    <span className="text-muted">Terpakai</span>
                    <span>
                      {formatCurrency(spent)} / {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className={`h-full rounded-full ${
                        percentage > 100 ? "bg-danger" : "bg-accent"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p
                    className={`mt-2 text-right text-xs ${
                      percentage > 100 ? "text-danger" : "text-muted"
                    }`}
                  >
                    {percentage.toFixed(0)}%
                  </p>
                </article>
              );
            })
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState
                title="Belum ada budget"
                description="Buat budget untuk kategori pengeluaran prioritas."
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
