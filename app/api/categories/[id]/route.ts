import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { categorySchema, parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const payload = await parseJson(request, categorySchema.partial());
    const result = await getSupabaseAdmin()
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    assertSupabaseResult(result, "Gagal memperbarui kategori.");
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
    const result = await getSupabaseAdmin().from("categories").delete().eq("id", id);
    assertSupabaseResult(result, "Gagal menghapus kategori.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
