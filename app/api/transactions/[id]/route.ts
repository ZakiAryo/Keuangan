import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson, transactionSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const select =
  "*, category:categories(id,name,color,type), wallet:wallets(id,name,color)";

export async function PUT(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const payload = await parseJson(request, transactionSchema.partial());
    const result = await getSupabaseAdmin()
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .select(select)
      .single();
    assertSupabaseResult(result, "Gagal memperbarui transaksi.");
    return NextResponse.json({ data: result.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const result = await getSupabaseAdmin()
      .from("transactions")
      .delete()
      .eq("id", id);
    assertSupabaseResult(result, "Gagal menghapus transaksi.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
