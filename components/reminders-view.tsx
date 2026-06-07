"use client";

import { FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BellRing,
  CalendarClock,
  Check,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/client-api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  ActionButton,
  EmptyState,
  Field,
  SectionHeader,
  SelectField,
  TextareaField,
} from "@/components/ui";
import type { PaymentReminder } from "@/types/finance";

function createEmptyForm() {
  return {
    title: "",
    due_date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    notes: "",
  };
}

type ReminderFilter = "all" | "pending" | "paid";

function reminderLabel(reminder: PaymentReminder, today: string) {
  if (reminder.status === "paid") return "Sudah dibayar";
  if (reminder.due_date < today) return "Terlambat";
  if (reminder.due_date === today) return "Jatuh tempo hari ini";
  return "Akan datang";
}

function reminderBadgeClass(reminder: PaymentReminder, today: string) {
  if (reminder.status === "paid") {
    return "border-accent/20 bg-accent/10 text-accent";
  }
  if (reminder.due_date < today) {
    return "border-danger/25 bg-danger/10 text-danger";
  }
  if (reminder.due_date === today) {
    return "border-amber-300/25 bg-amber-300/10 text-amber-200";
  }
  return "border-line bg-white/[0.03] text-muted";
}

export function RemindersView({
  reminders,
  refresh,
  notify,
}: {
  reminders: PaymentReminder[];
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReminderFilter>("pending");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const summary = (() => {
    const pending = reminders.filter((item) => item.status === "pending");
    return {
      pending: pending.length,
      overdue: pending.filter((item) => item.due_date < today).length,
      dueToday: pending.filter((item) => item.due_date === today).length,
      paid: reminders.filter((item) => item.status === "paid").length,
    };
  })();

  const visibleReminders = useMemo(
    () =>
      reminders.filter((reminder) =>
        filter === "all" ? true : reminder.status === filter,
      ),
    [filter, reminders],
  );

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm());
  }

  function startEdit(reminder: PaymentReminder) {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      due_date: reminder.due_date,
      amount: reminder.amount === null ? "" : String(reminder.amount),
      notes: reminder.notes ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiRequest(
        editingId ? `/api/reminders/${editingId}` : "/api/reminders",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            title: form.title,
            due_date: form.due_date,
            amount: form.amount ? Number(form.amount) : null,
            notes: form.notes || null,
          }),
        },
      );
      notify(editingId ? "Reminder diperbarui." : "Reminder ditambahkan.");
      resetForm();
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Gagal menyimpan reminder.",
        true,
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(reminder: PaymentReminder) {
    setActionId(reminder.id);
    try {
      const isPaid = reminder.status === "paid";
      await apiRequest(`/api/reminders/${reminder.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: isPaid ? "pending" : "paid" }),
      });
      notify(
        isPaid
          ? "Reminder dikembalikan menjadi belum dibayar."
          : "Reminder ditandai sudah dibayar.",
      );
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Gagal memperbarui status.",
        true,
      );
    } finally {
      setActionId(null);
    }
  }

  async function remove(reminder: PaymentReminder) {
    if (!window.confirm(`Hapus reminder "${reminder.title}"?`)) return;
    setActionId(reminder.id);
    try {
      await apiRequest(`/api/reminders/${reminder.id}`, { method: "DELETE" });
      if (editingId === reminder.id) resetForm();
      notify("Reminder dihapus.");
      await refresh();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Gagal menghapus reminder.",
        true,
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Jadwal pembayaran"
        title="Reminder tagihan"
        description="Catat apa yang harus dibayar dan tanggal jatuh temponya. Nominal dan catatan bersifat opsional."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Belum dibayar", value: summary.pending, color: "text-slate-100" },
          { label: "Terlambat", value: summary.overdue, color: "text-danger" },
          { label: "Hari ini", value: summary.dueToday, color: "text-amber-200" },
          { label: "Sudah dibayar", value: summary.paid, color: "text-accent" },
        ].map((item) => (
          <div className="panel p-4" key={item.label}>
            <p className="text-xs text-muted">{item.label}</p>
            <p className={cn("mt-2 text-2xl font-semibold", item.color)}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <form className="panel p-5" onSubmit={submit}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">
              {editingId ? "Edit reminder" : "Reminder baru"}
            </h3>
            <p className="mt-1 text-xs text-muted">
              Contoh: bayar listrik, internet, cicilan, atau langganan.
            </p>
          </div>
          {editingId ? (
            <ActionButton type="button" onClick={resetForm}>
              <X size={14} /> Batal
            </ActionButton>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Nama tagihan"
            value={form.title}
            maxLength={120}
            placeholder="Contoh: Bayar listrik"
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <Field
            label="Tanggal jatuh tempo"
            type="date"
            value={form.due_date}
            onChange={(event) =>
              setForm({ ...form, due_date: event.target.value })
            }
            required
          />
          <Field
            label="Nominal opsional"
            type="number"
            min="1"
            value={form.amount}
            placeholder="Contoh: 500000"
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value })
            }
          />
          <div className="md:col-span-2 xl:col-span-3">
            <TextareaField
              label="Catatan opsional"
              value={form.notes}
              maxLength={1000}
              placeholder="Nomor pelanggan, cara pembayaran, atau detail lain"
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <ActionButton variant="primary" type="submit" disabled={saving}>
            <Plus size={16} />
            {saving
              ? "Menyimpan..."
              : editingId
                ? "Simpan perubahan"
                : "Tambah reminder"}
          </ActionButton>
        </div>
      </form>

      <section className="panel mt-5 p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-semibold">Daftar reminder</h3>
            <p className="mt-1 text-xs text-muted">
              Reminder belum dibayar diurutkan dari jatuh tempo terdekat.
            </p>
          </div>
          <div className="w-full sm:w-48">
            <SelectField
              label="Filter status"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as ReminderFilter)
              }
            >
              <option value="pending">Belum dibayar</option>
              <option value="paid">Sudah dibayar</option>
              <option value="all">Semua reminder</option>
            </SelectField>
          </div>
        </div>

        <div className="space-y-3">
          {visibleReminders.length ? (
            visibleReminders.map((reminder) => (
              <article
                className={cn(
                  "rounded-xl border p-4",
                  reminder.status === "pending" && reminder.due_date < today
                    ? "border-danger/25 bg-danger/[0.035]"
                    : "border-line bg-white/[0.015]",
                )}
                key={reminder.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <BellRing
                        className={
                          reminder.status === "paid"
                            ? "text-accent"
                            : reminder.due_date < today
                              ? "text-danger"
                              : "text-amber-200"
                        }
                        size={17}
                      />
                      <h4
                        className={cn(
                          "font-medium",
                          reminder.status === "paid" &&
                            "text-muted line-through",
                        )}
                      >
                        {reminder.title}
                      </h4>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          reminderBadgeClass(reminder, today),
                        )}
                      >
                        {reminderLabel(reminder, today)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock size={14} />
                        {formatDate(reminder.due_date)}
                      </span>
                      {reminder.amount !== null ? (
                        <span className="font-medium text-slate-300">
                          {formatCurrency(reminder.amount)}
                        </span>
                      ) : null}
                    </div>
                    {reminder.notes ? (
                      <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted">
                        {reminder.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      variant={
                        reminder.status === "paid" ? "secondary" : "primary"
                      }
                      disabled={actionId === reminder.id}
                      onClick={() => void togglePaid(reminder)}
                    >
                      {reminder.status === "paid" ? (
                        <RotateCcw size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                      {reminder.status === "paid" ? "Belum lunas" : "Sudah bayar"}
                    </ActionButton>
                    <ActionButton
                      disabled={actionId === reminder.id}
                      onClick={() => startEdit(reminder)}
                    >
                      <Pencil size={14} /> Edit
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      disabled={actionId === reminder.id}
                      onClick={() => void remove(reminder)}
                    >
                      <Trash2 size={14} /> Hapus
                    </ActionButton>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="Belum ada reminder"
              description={
                filter === "pending"
                  ? "Tambahkan tagihan yang perlu dibayar agar tidak terlewat."
                  : "Tidak ada reminder dengan status ini."
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
