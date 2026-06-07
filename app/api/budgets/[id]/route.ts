import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { budgetSchema, parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const payload = await parseJson(request, budgetSchema.partial());
    const result = await getSupabaseAdmin()
      .from("budgets")
      .update(payload)
      .eq("id", id)
      .select("*, category:categories(id,name,color,type,payment_method)")
      .single();
    assertSupabaseResult(result, "Gagal memperbarui budget.");
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
    const result = await getSupabaseAdmin().from("budgets").delete().eq("id", id);
    assertSupabaseResult(result, "Gagal menghapus budget.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
