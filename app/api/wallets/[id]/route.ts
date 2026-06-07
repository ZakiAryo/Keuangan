import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson, walletSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const payload = await parseJson(request, walletSchema.partial());
    const result = await getSupabaseAdmin()
      .from("wallets")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    assertSupabaseResult(result, "Gagal memperbarui wallet.");
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
    const result = await getSupabaseAdmin().from("wallets").delete().eq("id", id);
    assertSupabaseResult(result, "Gagal menghapus wallet.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
