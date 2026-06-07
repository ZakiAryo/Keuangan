"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { AppShell, type AppView } from "@/components/app-shell";
import { BudgetsView } from "@/components/budgets-view";
import { DashboardView } from "@/components/dashboard-view";
import { DataToolsView } from "@/components/data-tools-view";
import { MasterDataView } from "@/components/master-data-view";
import { ReportsView } from "@/components/reports-view";
import { TransactionsView } from "@/components/transactions-view";
import { TransfersView } from "@/components/transfers-view";
import { apiRequest } from "@/lib/client-api";
import type {
  Budget,
  Category,
  DashboardData,
  Transaction,
  Wallet,
  WalletTransfer,
} from "@/types/finance";

interface FinanceState {
  dashboard: DashboardData | null;
  categories: Category[];
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  transfers: WalletTransfer[];
}

const initialState: FinanceState = {
  dashboard: null,
  categories: [],
  wallets: [],
  transactions: [],
  budgets: [],
  transfers: [],
};

export function FinanceApp() {
  const [view, setView] = useState<AppView>("dashboard");
  const [data, setData] = useState<FinanceState>(initialState);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(
    null,
  );

  const notify = useCallback((message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const refresh = useCallback(async () => {
    setLoadError("");
    try {
      const [dashboard, categories, wallets, transactions, budgets, transfers] =
        await Promise.all([
          apiRequest<{ data: DashboardData }>("/api/dashboard"),
          apiRequest<{ data: Category[] }>("/api/categories"),
          apiRequest<{ data: Wallet[] }>("/api/wallets"),
          apiRequest<{ data: Transaction[] }>("/api/transactions"),
          apiRequest<{ data: Budget[] }>("/api/budgets"),
          apiRequest<{ data: WalletTransfer[] }>("/api/transfers"),
        ]);
      setData({
        dashboard: dashboard.data,
        categories: categories.data,
        wallets: wallets.data,
        transactions: transactions.data,
        budgets: budgets.data,
        transfers: transfers.data,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat data aplikasi.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function logout() {
    try {
      await apiRequest("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/pin";
    }
  }

  return (
    <AppShell
      view={view}
      onViewChange={setView}
      onLogout={() => void logout()}
    >
      {loadError ? (
        <div className="panel mb-5 flex flex-col gap-4 border-danger/30 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={20} />
            <div>
              <p className="font-medium text-danger">Data belum dapat dimuat</p>
              <p className="mt-1 text-sm text-muted">{loadError}</p>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => void refresh()}>
            <RefreshCw size={15} /> Coba lagi
          </button>
        </div>
      ) : null}

      {view === "dashboard" ? (
        <DashboardView data={loading ? null : data.dashboard} />
      ) : null}
      {view === "transactions" ? (
        <TransactionsView
          transactions={data.transactions}
          categories={data.categories}
          wallets={data.wallets}
          refresh={refresh}
          notify={notify}
        />
      ) : null}
      {view === "master" ? (
        <MasterDataView
          categories={data.categories}
          wallets={data.wallets}
          refresh={refresh}
          notify={notify}
        />
      ) : null}
      {view === "transfers" ? (
        <TransfersView
          wallets={data.wallets}
          transfers={data.transfers}
          refresh={refresh}
          notify={notify}
        />
      ) : null}
      {view === "budgets" ? (
        <BudgetsView
          budgets={data.budgets}
          categories={data.categories}
          refresh={refresh}
          notify={notify}
        />
      ) : null}
      {view === "reports" ? <ReportsView notify={notify} /> : null}
      {view === "settings" ? (
        <DataToolsView
          notify={notify}
          onLogout={() => void logout()}
          refresh={refresh}
        />
      ) : null}

      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
            toast.error
              ? "border-danger/30 bg-[#261019] text-rose-100"
              : "border-accent/30 bg-[#0b2118] text-emerald-50"
          }`}
        >
          {toast.error ? (
            <AlertCircle className="mt-0.5 shrink-0 text-danger" size={18} />
          ) : (
            <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={18} />
          )}
          {toast.message}
        </div>
      ) : null}
    </AppShell>
  );
}
