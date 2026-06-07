"use client";

import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  FolderCog,
  Gauge,
  Landmark,
  LogOut,
  ReceiptText,
  Settings2,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AppView =
  | "dashboard"
  | "transactions"
  | "master"
  | "transfers"
  | "budgets"
  | "reports"
  | "settings";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "transactions", label: "Transaksi", icon: ReceiptText },
  { id: "master", label: "Data utama", icon: FolderCog },
  { id: "transfers", label: "Transfer", icon: ArrowLeftRight },
  { id: "budgets", label: "Budget", icon: Target },
  { id: "reports", label: "Laporan", icon: ChartNoAxesCombined },
  { id: "settings", label: "Data", icon: Settings2 },
] as const;

export function AppShell({
  view,
  onViewChange,
  onLogout,
  children,
}: {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-[#080d15]/95 px-4 py-5 backdrop-blur lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
            <Landmark size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">Personal Finance</p>
            <p className="text-xs text-muted">Private tracker</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  view === item.id
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-muted hover:bg-white/[0.04] hover:text-slate-200",
                )}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          className="absolute bottom-5 left-4 right-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-danger/10 hover:text-danger"
          onClick={onLogout}
        >
          <LogOut size={18} />
          Keluar
        </button>
      </aside>

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:col-start-2 lg:px-9 lg:pb-10 lg:pt-8">
        <div className="mx-auto max-w-[1440px]">{children}</div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-line bg-[#0b111b]/95 p-1.5 shadow-2xl backdrop-blur lg:hidden">
        {navigation.slice(0, 6).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              aria-label={item.label}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition",
                view === item.id ? "bg-accent/10 text-accent" : "text-muted",
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon size={18} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
        <button
          aria-label="Data dan pengaturan"
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition",
            view === "settings" ? "bg-accent/10 text-accent" : "text-muted",
          )}
          onClick={() => onViewChange("settings")}
        >
          <Settings2 size={18} />
          <span>Data</span>
        </button>
      </nav>
    </div>
  );
}
