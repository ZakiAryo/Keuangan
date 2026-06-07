"use client";

import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  CalendarClock,
  WalletCards,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CHART_COLORS,
  chartTooltipContentStyle,
  chartTooltipTextStyle,
} from "@/lib/chart-theme";
import { EmptyState, SectionHeader } from "@/components/ui";
import type { DashboardData, PaymentReminder } from "@/types/finance";

export function DashboardView({
  data,
  reminders,
}: {
  data: DashboardData | null;
  reminders: PaymentReminder[];
}) {
  if (!data) return <DashboardSkeleton />;
  const today = format(new Date(), "yyyy-MM-dd");

  const cards = [
    {
      label: "Total saldo",
      value: data.totals.balance,
      icon: WalletCards,
      color: "text-accent",
    },
    {
      label: "Pemasukan bulan ini",
      value: data.totals.income,
      icon: ArrowUpRight,
      color: "text-emerald-400",
    },
    {
      label: "Pengeluaran bulan ini",
      value: data.totals.expense,
      icon: ArrowDownRight,
      color: "text-danger",
    },
    {
      label: "Budget terpakai",
      value: data.totals.budgetUsed,
      icon: Target,
      color: "text-amber-300",
      detail: data.totals.budget
        ? `${Math.min((data.totals.budgetUsed / data.totals.budget) * 100, 999).toFixed(0)}% dari ${formatCurrency(data.totals.budget)}`
        : "Belum ada budget",
    },
  ];

  return (
    <>
      <SectionHeader
        eyebrow="Ringkasan"
        title="Dashboard keuangan"
        description="Platform untuk manage uang, semangat menabung!!."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="panel p-5" key={card.label}>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-muted">{card.label}</p>
                <Icon className={card.color} size={20} />
              </div>
              <p className="text-xl font-semibold tracking-tight sm:text-2xl">
                {formatCurrency(card.value)}
              </p>
              {card.detail ? (
                <p className="mt-2 text-xs text-muted">{card.detail}</p>
              ) : null}
            </article>
          );
        })}
      </div>

      <section className="panel mt-4 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Reminder pembayaran</h3>
            <p className="mt-1 text-xs text-muted">
              Tagihan belum dibayar dengan jatuh tempo terdekat.
            </p>
          </div>
          <BellRing className="text-amber-200" size={20} />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {reminders.filter((item) => item.status === "pending").length ? (
            reminders
              .filter((item) => item.status === "pending")
              .slice(0, 4)
              .map((reminder) => {
                const overdue = reminder.due_date < today;
                const dueToday = reminder.due_date === today;
                return (
                  <article
                    className={`rounded-xl border p-4 ${
                      overdue
                        ? "border-danger/25 bg-danger/[0.04]"
                        : "border-line bg-white/[0.02]"
                    }`}
                    key={reminder.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{reminder.title}</p>
                      <CalendarClock
                        className={
                          overdue
                            ? "shrink-0 text-danger"
                            : dueToday
                              ? "shrink-0 text-amber-200"
                              : "shrink-0 text-muted"
                        }
                        size={17}
                      />
                    </div>
                    <p
                      className={`mt-2 text-xs ${
                        overdue
                          ? "text-danger"
                          : dueToday
                            ? "text-amber-200"
                            : "text-muted"
                      }`}
                    >
                      {overdue
                        ? "Terlambat"
                        : dueToday
                          ? "Jatuh tempo hari ini"
                          : formatDate(reminder.due_date)}
                    </p>
                    {reminder.amount !== null ? (
                      <p className="mt-3 text-sm font-semibold">
                        {formatCurrency(reminder.amount)}
                      </p>
                    ) : null}
                  </article>
                );
              })
          ) : (
            <div className="md:col-span-2 xl:col-span-4">
              <EmptyState
                title="Tidak ada tagihan tertunda"
                description="Reminder yang belum dibayar akan muncul di sini."
              />
            </div>
          )}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel p-5">
          <h3 className="mb-5 font-semibold">Arus kas 6 bulan</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.income}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.income}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.expense}
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.expense}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke={CHART_COLORS.income}
                  fill="url(#income)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke={CHART_COLORS.expense}
                  fill="url(#expense)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-5">
          <h3 className="mb-5 font-semibold">Pengeluaran per kategori</h3>
          {data.expenseByCategory.length ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {data.expenseByCategory.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipContentStyle}
                      labelStyle={chartTooltipTextStyle}
                      itemStyle={chartTooltipTextStyle}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {data.expenseByCategory.slice(0, 5).map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 text-sm"
                    key={item.name}
                  >
                    <span className="flex items-center gap-2 text-muted">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span>{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="Belum ada pengeluaran"
              description="Pengeluaran bulan ini akan dirangkum di sini."
            />
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.55fr]">
        <section className="panel p-5">
          <h3 className="mb-4 font-semibold">Saldo wallet</h3>
          <div className="space-y-3">
            {data.wallets.length ? (
              data.wallets.map((wallet) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] px-4 py-3"
                  key={wallet.id}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-9 w-1 rounded-full"
                      style={{ backgroundColor: wallet.color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{wallet.name}</p>
                      <p className="text-xs text-muted">{wallet.type}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(wallet.balance ?? 0)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Belum ada wallet"
                description="Tambahkan wallet untuk mulai menghitung saldo."
              />
            )}
          </div>
        </section>

        <section className="panel p-5">
          <h3 className="mb-4 font-semibold">Transaksi terbaru</h3>
          <div className="space-y-2">
            {data.recentTransactions.length ? (
              data.recentTransactions.map((transaction) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"
                  key={transaction.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {transaction.description}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {transaction.category?.name} ·{" "}
                      {transaction.category?.payment_method === "cash"
                        ? "Cash"
                        : "Non-Cash"}{" "}
                      ·{" "}
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>
                  <p
                    className={
                      transaction.type === "income"
                        ? "whitespace-nowrap text-sm font-semibold text-accent"
                        : "whitespace-nowrap text-sm font-semibold text-danger"
                    }
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Belum ada transaksi"
                description="Transaksi terbaru akan muncul di bagian ini."
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 h-20 max-w-md rounded-2xl bg-white/[0.04]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="panel h-32 bg-white/[0.025]" key={index} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="panel h-80 bg-white/[0.025]" />
        <div className="panel h-80 bg-white/[0.025]" />
      </div>
    </div>
  );
}
