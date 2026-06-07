import { NextResponse } from "next/server";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    await requirePinSession();
    const supabase = getSupabaseAdmin();
    const [categories, wallets, transactions, budgets, transfers] =
      await Promise.all([
        supabase.from("categories").select("*").order("created_at"),
        supabase.from("wallets").select("*").order("created_at"),
        supabase.from("transactions").select("*").order("created_at"),
        supabase.from("budgets").select("*").order("created_at"),
        supabase.from("wallet_transfers").select("*").order("created_at"),
      ]);

    [
      categories,
      wallets,
      transactions,
      budgets,
      transfers,
    ].forEach((result) => assertSupabaseResult(result, "Gagal membuat backup."));

    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        categories: categories.data ?? [],
        wallets: wallets.data ?? [],
        transactions: transactions.data ?? [],
        budgets: budgets.data ?? [],
        wallet_transfers: transfers.data ?? [],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
