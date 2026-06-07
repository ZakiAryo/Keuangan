"use client";

import { FormEvent, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ActionButton,
  EmptyState,
  Field,
  SectionHeader,
  SelectField,
} from "@/components/ui";
import type { Budget, Category } from "@/types/finance";

const defaultStartDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
const defaultEndDate = format(endOfMonth(new Date()), "yyyy-MM-dd");

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
    start_date: defaultStartDate,
    end_date: defaultEndDate,
    amount: "",
  });
  const expenseCategories = Array.from(
    new Map(
      categories
        .filter((category) => category.type === "expense")
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((category) => [category.name.toLowerCase(), category]),
    ).values(),
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          category_id: form.category_id,
          start_date: form.start_date,
          end_date: form.end_date,
          amount: Number(form.amount),
        }),
      });
      notify("Budget disimpan.");
      setForm({ ...form, category_id: "", amount: "" });
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Gagal menyimpan budget.",
        true,
      );
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
        title="Budget periode"
        description="Tetapkan batas pengeluaran per kategori pada rentang tanggal tertentu. Cash dan Non-Cash dihitung akumulasi berdasarkan nama kategori."
      />
      <form className="panel p-5" onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Kategori pengeluaran"
            value={form.category_id}
            onChange={(event) =>
              setForm({ ...form, category_id: event.target.value })
            }
            required
          >
            <option value="">Pilih kategori</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <Field
            label="Dari tanggal"
            type="date"
            value={form.start_date}
            onChange={(event) =>
              setForm({ ...form, start_date: event.target.value })
            }
            required
          />
          <Field
            label="Sampai tanggal"
            type="date"
            value={form.end_date}
            onChange={(event) =>
              setForm({ ...form, end_date: event.target.value })
            }
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
                <article
                  className="rounded-xl border border-line p-4"
                  key={budget.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{budget.category?.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(budget.start_date)} -{" "}
                        {formatDate(budget.end_date)}
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
