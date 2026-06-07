import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { fetchTransfers } from "@/lib/finance-data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson, transferSchema } from "@/lib/validation";

const select =
  "*, from_wallet:wallets!wallet_transfers_from_wallet_id_fkey(id,name,color), to_wallet:wallets!wallet_transfers_to_wallet_id_fkey(id,name,color)";

export async function GET() {
  try {
    await requirePinSession();
    return NextResponse.json({ data: await fetchTransfers() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePinSession();
    const payload = await parseJson(request, transferSchema);
    const result = await getSupabaseAdmin()
      .from("wallet_transfers")
      .insert(payload)
      .select(select)
      .single();
    assertSupabaseResult(result, "Gagal membuat transfer.");
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePinSession();
    const id = z.string().uuid().parse(request.nextUrl.searchParams.get("id"));
    const result = await getSupabaseAdmin()
      .from("wallet_transfers")
      .delete()
      .eq("id", id);
    assertSupabaseResult(result, "Gagal menghapus transfer.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
