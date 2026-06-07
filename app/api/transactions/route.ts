import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson, transactionSchema } from "@/lib/validation";

const select =
  "*, category:categories!inner(id,name,color,type,payment_method), wallet:wallets(id,name,color)";

export async function GET(request: NextRequest) {
  try {
    await requirePinSession();
    const params = request.nextUrl.searchParams;
    let query = getSupabaseAdmin()
      .from("transactions")
      .select(select)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    const from = params.get("from");
    const to = params.get("to");
    const type = z
      .enum(["income", "expense"])
      .optional()
      .parse(params.get("type") ?? undefined);
    const walletId = params.get("wallet_id");
    const categoryId = params.get("category_id");
    const paymentMethod = z
      .enum(["cash", "non_cash"])
      .optional()
      .parse(params.get("payment_method") ?? undefined);
    const limit = Math.min(Number(params.get("limit") || 200), 1000);

    if (from) query = query.gte("transaction_date", from);
    if (to) query = query.lte("transaction_date", to);
    if (type) query = query.eq("type", type);
    if (walletId) query = query.eq("wallet_id", walletId);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (paymentMethod) {
      query = query.eq("category.payment_method", paymentMethod);
    }
    query = query.limit(Number.isFinite(limit) ? limit : 200);

    const result = await query;
    assertSupabaseResult(result, "Gagal mengambil transaksi.");
    return NextResponse.json({ data: result.data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePinSession();
    const payload = await parseJson(request, transactionSchema);
    const result = await getSupabaseAdmin()
      .from("transactions")
      .insert(payload)
      .select(select)
      .single();
    assertSupabaseResult(result, "Gagal membuat transaksi.");
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
