import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { budgetUpdateSchema, parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const payload = await parseJson(request, budgetUpdateSchema);
    const existingResult = await getSupabaseAdmin()
      .from("budgets")
      .select("start_date,end_date")
      .eq("id", id)
      .single();
    assertSupabaseResult(existingResult, "Budget tidak ditemukan.");
    const startDate = payload.start_date ?? existingResult.data?.start_date;
    const endDate = payload.end_date ?? existingResult.data?.end_date;
    if (startDate && endDate && startDate > endDate) {
      throw new ApiError(
        400,
        "Tanggal awal budget tidak boleh melewati tanggal akhir.",
      );
    }

    const result = await getSupabaseAdmin()
      .from("budgets")
      .update({
        ...payload,
        ...(payload.start_date
          ? { month: `${payload.start_date.slice(0, 7)}-01` }
          : {}),
      })
      .eq("id", id)
      .select("*, category:categories(id,name,color,type)")
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
