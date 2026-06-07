export type TransactionType = "income" | "expense";
export type PaymentMethod = "cash" | "non_cash";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  payment_method: PaymentMethod;
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: string;
  initial_balance: number;
  color: string;
  created_at: string;
  updated_at: string;
  balance?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  notes: string | null;
  category_id: string;
  wallet_id: string;
  category?: Pick<
    Category,
    "id" | "name" | "color" | "type" | "payment_method"
  > | null;
  wallet?: Pick<Wallet, "id" | "name" | "color"> | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  month: string;
  amount: number;
  category?: Pick<
    Category,
    "id" | "name" | "color" | "payment_method"
  > | null;
  spent?: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransfer {
  id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  fee: number;
  transfer_date: string;
  notes: string | null;
  from_wallet?: Pick<Wallet, "id" | "name" | "color"> | null;
  to_wallet?: Pick<Wallet, "id" | "name" | "color"> | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  totals: {
    balance: number;
    income: number;
    expense: number;
    budget: number;
    budgetUsed: number;
  };
  wallets: Wallet[];
  recentTransactions: Transaction[];
  monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  expenseByCategory: Array<{ name: string; value: number; color: string }>;
}

export interface ReportData {
  period: { from: string; to: string };
  summary: { income: number; expense: number; net: number };
  byCategory: Array<{
    categoryId: string;
    name: string;
    color: string;
    type: TransactionType;
    paymentMethod: PaymentMethod;
    total: number;
  }>;
  monthly: Array<{ month: string; income: number; expense: number; net: number }>;
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  data: {
    categories: Category[];
    wallets: Wallet[];
    transactions: Transaction[];
    budgets: Budget[];
    wallet_transfers: WalletTransfer[];
  };
}
