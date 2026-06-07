import { format, startOfMonth, subMonths } from "date-fns";
import { ApiError, assertSupabaseResult } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toNumber } from "@/lib/utils";
import type {
  Budget,
  DashboardData,
  ReportData,
  Transaction,
  Wallet,
  WalletTransfer,
} from "@/types/finance";

const transactionSelect =
  "*, category:categories(id,name,color,type,payment_method), wallet:wallets(id,name,color)";
const transferSelect =
  "*, from_wallet:wallets!wallet_transfers_from_wallet_id_fkey(id,name,color), to_wallet:wallets!wallet_transfers_to_wallet_id_fkey(id,name,color)";

export async function fetchTransactions() {
  const result = await getSupabaseAdmin()
    .from("transactions")
    .select(transactionSelect)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  assertSupabaseResult(result, "Gagal mengambil transaksi.");
  return (result.data ?? []) as unknown as Transaction[];
}

export async function fetchTransfers() {
  const result = await getSupabaseAdmin()
    .from("wallet_transfers")
    .select(transferSelect)
    .order("transfer_date", { ascending: false })
    .order("created_at", { ascending: false });
  assertSupabaseResult(result, "Gagal mengambil transfer.");
  return (result.data ?? []) as unknown as WalletTransfer[];
}

export function calculateWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[],
  transfers: WalletTransfer[],
) {
  return wallets.map((wallet) => {
    const transactionChange = transactions.reduce((total, transaction) => {
      if (transaction.wallet_id !== wallet.id) return total;
      const amount = toNumber(transaction.amount);
      return total + (transaction.type === "income" ? amount : -amount);
    }, 0);
    const transferChange = transfers.reduce((total, transfer) => {
      if (transfer.from_wallet_id === wallet.id) {
        return total - toNumber(transfer.amount) - toNumber(transfer.fee);
      }
      if (transfer.to_wallet_id === wallet.id) {
        return total + toNumber(transfer.amount);
      }
      return total;
    }, 0);

    return {
      ...wallet,
      initial_balance: toNumber(wallet.initial_balance),
      balance: toNumber(wallet.initial_balance) + transactionChange + transferChange,
    };
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdmin();
  const [walletResult, budgetResult, transactions, transfers] =
    await Promise.all([
      supabase.from("wallets").select("*").order("created_at"),
      supabase
        .from("budgets")
        .select("*, category:categories(id,name,color,payment_method)")
        .eq("month", format(startOfMonth(new Date()), "yyyy-MM-dd")),
      fetchTransactions(),
      fetchTransfers(),
    ]);

  assertSupabaseResult(walletResult, "Gagal mengambil wallet.");
  assertSupabaseResult(budgetResult, "Gagal mengambil budget.");

  const wallets = calculateWalletBalances(
    (walletResult.data ?? []) as Wallet[],
    transactions,
    transfers,
  );
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const currentTransactions = transactions.filter(
    (transaction) => transaction.transaction_date >= monthStart,
  );
  const income = currentTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
  const expense = currentTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);

  const budgets = (budgetResult.data ?? []) as unknown as Budget[];
  const budget = budgets.reduce(
    (total, item) => total + toNumber(item.amount),
    0,
  );
  const budgetCategoryIds = new Set(budgets.map((item) => item.category_id));
  const budgetUsed = currentTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        budgetCategoryIds.has(transaction.category_id),
    )
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);

  const monthKeys = Array.from({ length: 6 }, (_, index) =>
    format(startOfMonth(subMonths(new Date(), 5 - index)), "yyyy-MM"),
  );
  const monthlyTrend = monthKeys.map((month) => {
    const items = transactions.filter((transaction) =>
      transaction.transaction_date.startsWith(month),
    );
    return {
      month,
      income: items
        .filter((item) => item.type === "income")
        .reduce((total, item) => total + toNumber(item.amount), 0),
      expense: items
        .filter((item) => item.type === "expense")
        .reduce((total, item) => total + toNumber(item.amount), 0),
    };
  });

  const categoryMap = new Map<string, { name: string; value: number; color: string }>();
  currentTransactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const category = transaction.category;
      const key = transaction.category_id;
      const current = categoryMap.get(key);
      categoryMap.set(key, {
        name: category?.name ?? "Tanpa kategori",
        value: (current?.value ?? 0) + toNumber(transaction.amount),
        color: category?.color ?? "#8b9bb0",
      });
    });

  return {
    totals: {
      balance: wallets.reduce(
        (total, wallet) => total + toNumber(wallet.balance),
        0,
      ),
      income,
      expense,
      budget,
      budgetUsed,
    },
    wallets,
    recentTransactions: transactions.slice(0, 8),
    monthlyTrend,
    expenseByCategory: Array.from(categoryMap.values()).sort(
      (left, right) => right.value - left.value,
    ),
  };
}

export async function getReportData(
  from: string,
  to: string,
  paymentMethod?: "cash" | "non_cash",
): Promise<ReportData> {
  if (from > to) {
    throw new ApiError(400, "Tanggal awal tidak boleh melewati tanggal akhir.");
  }

  const result = await getSupabaseAdmin()
    .from("transactions")
    .select(transactionSelect)
    .gte("transaction_date", from)
    .lte("transaction_date", to)
    .order("transaction_date");
  assertSupabaseResult(result, "Gagal mengambil laporan.");
  const transactions = ((result.data ?? []) as unknown as Transaction[]).filter(
    (transaction) =>
      !paymentMethod ||
      transaction.category?.payment_method === paymentMethod,
  );

  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + toNumber(item.amount), 0);
  const expense = transactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + toNumber(item.amount), 0);

  const categories = new Map<
    string,
    ReportData["byCategory"][number]
  >();
  const months = new Map<string, ReportData["monthly"][number]>();

  transactions.forEach((transaction) => {
    const category = categories.get(transaction.category_id);
    categories.set(transaction.category_id, {
      categoryId: transaction.category_id,
      name: transaction.category?.name ?? "Tanpa kategori",
      color: transaction.category?.color ?? "#8b9bb0",
      type: transaction.type,
      paymentMethod: transaction.category?.payment_method ?? "non_cash",
      total: (category?.total ?? 0) + toNumber(transaction.amount),
    });

    const monthKey = transaction.transaction_date.slice(0, 7);
    const month = months.get(monthKey) ?? {
      month: monthKey,
      income: 0,
      expense: 0,
      net: 0,
    };
    month[transaction.type] += toNumber(transaction.amount);
    month.net = month.income - month.expense;
    months.set(monthKey, month);
  });

  return {
    period: { from, to },
    summary: { income, expense, net: income - expense },
    byCategory: Array.from(categories.values()).sort(
      (left, right) => right.total - left.total,
    ),
    monthly: Array.from(months.values()).sort((left, right) =>
      left.month.localeCompare(right.month),
    ),
  };
}
