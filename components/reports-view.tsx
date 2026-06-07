"use client";

import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiRequest } from "@/lib/client-api";
import {
  CHART_COLORS,
  chartTooltipContentStyle,
  chartTooltipTextStyle,
} from "@/lib/chart-theme";
import { formatCurrency } from "@/lib/utils";
import {
  ActionButton,
  EmptyState,
  Field,
  SectionHeader,
  SelectField,
} from "@/components/ui";
import type { ReportData } from "@/types/finance";

const year = new Date().getFullYear();

export function ReportsView({
  notify,
}: {
  notify: (message: string, error?: boolean) => void;
}) {
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await apiRequest<{ data: ReportData }>(
        `/api/reports?from=${from}&to=${to}${
          paymentMethod === "all"
            ? ""
            : `&payment_method=${paymentMethod}`
        }`,
      );
      setReport(result.data);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Gagal memuat laporan.", true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
    // Laporan awal cukup dimuat sekali; perubahan tanggal diterapkan lewat tombol.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SectionHeader
        eyebrow="Analisis"
        title="Laporan keuangan"
        description="Tinjau pemasukan, pengeluaran, hasil bersih, serta komposisi kategori pada periode pilihan."
      />
      <section className="panel p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <Field
            label="Dari"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Field
            label="Sampai"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
          <SelectField
            label="Metode pembayaran"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="all">Cash & Non-Cash</option>
            <option value="cash">Cash</option>
            <option value="non_cash">Non-Cash</option>
          </SelectField>
          <ActionButton
            className="self-end"
            variant="primary"
            onClick={loadReport}
            disabled={loading}
          >
            <Search size={16} /> {loading ? "Memuat..." : "Tampilkan"}
          </ActionButton>
          <a
            className="btn-secondary self-end"
            href={`/api/export/csv?from=${from}&to=${to}${
              paymentMethod === "all"
                ? ""
                : `&payment_method=${paymentMethod}`
            }`}
          >
            <Download size={16} /> Export CSV
          </a>
        </div>
      </section>

      {report ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Summary label="Pemasukan" value={report.summary.income} color="text-accent" />
            <Summary label="Pengeluaran" value={report.summary.expense} color="text-danger" />
            <Summary
              label="Arus bersih"
              value={report.summary.net}
              color={report.summary.net >= 0 ? "text-accent" : "text-danger"}
            />
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section className="panel p-5">
              <h3 className="mb-5 font-semibold">Tren per bulan</h3>
              {report.monthly.length ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.monthly}>
                      <CartesianGrid
                        stroke={CHART_COLORS.grid}
                        strokeDasharray="4 4"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                      />
                      <YAxis
                        tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                        tickFormatter={(value) => `${Math.round(value / 1_000_000)}jt`}
                      />
                      <Tooltip
                        contentStyle={chartTooltipContentStyle}
                        labelStyle={chartTooltipTextStyle}
                        itemStyle={chartTooltipTextStyle}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        name="Pemasukan"
                        fill={CHART_COLORS.income}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name="Pengeluaran"
                        fill={CHART_COLORS.expense}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  title="Tidak ada data"
                  description="Tidak ditemukan transaksi pada periode ini."
                />
              )}
            </section>
            <section className="panel p-5">
              <h3 className="mb-5 font-semibold">Ringkasan kategori</h3>
              <div className="space-y-3">
                {report.byCategory.length ? (
                  report.byCategory.map((category) => (
                    <div
                      className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"
                      key={`${category.type}-${category.categoryId}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="text-sm font-medium">{category.name}</p>
                          <p className="text-xs text-muted">
                            {category.type === "income"
                              ? "Pemasukan"
                              : "Pengeluaran"}
                            {" · "}
                            {category.paymentMethod === "cash"
                              ? "Cash"
                              : "Non-Cash"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(category.total)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="Belum ada kategori"
                    description="Ringkasan kategori akan muncul setelah ada transaksi."
                  />
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}

function Summary({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <article className="panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${color}`}>
        {formatCurrency(value)}
      </p>
    </article>
  );
}
