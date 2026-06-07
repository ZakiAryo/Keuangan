import { NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { budgetSchema, parseJson } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

type BudgetRow = {
  id: string;
  category_id: string;
  month: string;
  start_date: string;
  end_date: string;
  amount: unknown;
  category?: { id: string; name: string; color: string; type: string } | null;
};

type BudgetTransactionRow = {
  type: string;
  amount: unknown;
  transaction_date: string;
  category?: { id: string; name: string; type: string } | null;
};

function budgetSpent(
  budget: BudgetRow,
  transactions: BudgetTransactionRow[],
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.transaction_date >= budget.start_date &&
        transaction.transaction_date <= budget.end_date &&
        transaction.category?.type === "expense" &&
        transaction.category?.name === budget.category?.name,
    )
    .reduce((total, transaction) => total + toNumber(transaction.amount), 0);
}

export async function GET(request: NextRequest) {
  try {
    await requirePinSession();
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    let query = getSupabaseAdmin()
      .from("budgets")
      .select("*, category:categories(id,name,color,type)")
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (from) query = query.gte("end_date", from);
    if (to) query = query.lte("start_date", to);
    const result = await query;
    assertSupabaseResult(result, "Gagal mengambil budget.");

    const budgets = (result.data ?? []) as unknown as BudgetRow[];
    const transactionResult = await getSupabaseAdmin()
      .from("transactions")
      .select("amount,transaction_date,type,category:categories(id,name,type)")
      .eq("type", "expense");
    assertSupabaseResult(transactionResult, "Gagal menghitung pemakaian budget.");
    const transactions =
      (transactionResult.data ?? []) as unknown as BudgetTransactionRow[];

    const data = budgets.map((budget) => ({
      ...budget,
      amount: toNumber(budget.amount),
      spent: budgetSpent(budget, transactions),
    }));
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePinSession();
    const payload = await parseJson(request, budgetSchema);
    const categoryResult = await getSupabaseAdmin()
      .from("categories")
      .select("id,type")
      .eq("id", payload.category_id)
      .single();
    assertSupabaseResult(categoryResult, "Kategori budget tidak ditemukan.");
    if (categoryResult.data?.type !== "expense") {
      throw new ApiError(
        400,
        "Budget hanya dapat dibuat untuk kategori pengeluaran.",
      );
    }

    const result = await getSupabaseAdmin()
      .from("budgets")
      .upsert(
        {
          ...payload,
          month: `${payload.start_date.slice(0, 7)}-01`,
        },
        { onConflict: "category_id,start_date,end_date" },
      )
      .select("*, category:categories(id,name,color,type)")
      .single();
    assertSupabaseResult(result, "Gagal menyimpan budget.");
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
