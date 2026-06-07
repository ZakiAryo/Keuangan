import { NextRequest, NextResponse } from "next/server";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { budgetSchema, parseJson } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await requirePinSession();
    const month = request.nextUrl.searchParams.get("month");
    let query = getSupabaseAdmin()
      .from("budgets")
      .select("*, category:categories(id,name,color,type)")
      .order("month", { ascending: false });
    if (month) query = query.eq("month", `${month.slice(0, 7)}-01`);
    const result = await query;
    assertSupabaseResult(result, "Gagal mengambil budget.");

    const budgets = result.data ?? [];
    const monthValues = [...new Set(budgets.map((item) => item.month))];
    const transactionResult = await getSupabaseAdmin()
      .from("transactions")
      .select("category_id,amount,transaction_date,type")
      .eq("type", "expense");
    assertSupabaseResult(transactionResult, "Gagal menghitung pemakaian budget.");

    const data = budgets.map((budget) => ({
      ...budget,
      amount: toNumber(budget.amount),
      spent: (transactionResult.data ?? [])
        .filter(
          (transaction) =>
            transaction.category_id === budget.category_id &&
            monthValues.includes(
              `${transaction.transaction_date.slice(0, 7)}-01`,
            ) &&
            transaction.transaction_date.startsWith(budget.month.slice(0, 7)),
        )
        .reduce(
          (total, transaction) => total + toNumber(transaction.amount),
          0,
        ),
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
    const result = await getSupabaseAdmin()
      .from("budgets")
      .upsert(payload, { onConflict: "category_id,month" })
      .select("*, category:categories(id,name,color,type)")
      .single();
    assertSupabaseResult(result, "Gagal menyimpan budget.");
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
