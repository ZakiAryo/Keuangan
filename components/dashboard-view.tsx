"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
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
import { EmptyState, SectionHeader } from "@/components/ui";
import type { DashboardData } from "@/types/finance";

export function DashboardView({ data }: { data: DashboardData | null }) {
  if (!data) return <DashboardSkeleton />;

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
        description="Pantau posisi kas, aktivitas bulan berjalan, dan tren enam bulan terakhir."
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <section className="panel p-5">
          <h3 className="mb-5 font-semibold">Arus kas 6 bulan</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#70e1b0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#70e1b0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1c2838" strokeDasharray="4 4" />
                <XAxis dataKey="month" tick={{ fill: "#8b9bb0", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "#8b9bb0", fontSize: 11 }}
                  tickFormatter={(value) => `${Math.round(value / 1_000_000)}jt`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d1420",
                    border: "1px solid #1c2838",
                    borderRadius: 12,
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#70e1b0"
                  fill="url(#income)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#fb7185"
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
                      contentStyle={{
                        background: "#0d1420",
                        border: "1px solid #1c2838",
                        borderRadius: 12,
                      }}
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
