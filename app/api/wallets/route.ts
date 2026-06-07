import { NextResponse } from "next/server";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import {
  calculateWalletBalances,
  fetchTransactions,
  fetchTransfers,
} from "@/lib/finance-data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson, walletSchema } from "@/lib/validation";
import type { Wallet } from "@/types/finance";

export async function GET() {
  try {
    await requirePinSession();
    const [result, transactions, transfers] = await Promise.all([
      getSupabaseAdmin().from("wallets").select("*").order("created_at"),
      fetchTransactions(),
      fetchTransfers(),
    ]);
    assertSupabaseResult(result, "Gagal mengambil wallet.");
    const data = calculateWalletBalances(
      (result.data ?? []) as Wallet[],
      transactions,
      transfers,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePinSession();
    const payload = await parseJson(request, walletSchema);
    const result = await getSupabaseAdmin()
      .from("wallets")
      .insert(payload)
      .select()
      .single();
    assertSupabaseResult(result, "Gagal membuat wallet.");
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
