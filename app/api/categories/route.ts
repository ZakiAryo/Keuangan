import { NextResponse } from "next/server";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { categorySchema, parseJson } from "@/lib/validation";

export async function GET() {
  try {
    await requirePinSession();
    const result = await getSupabaseAdmin()
      .from("categories")
      .select("*")
      .order("type")
      .order("payment_method")
      .order("name");
    assertSupabaseResult(result, "Gagal mengambil kategori.");
    return NextResponse.json({ data: result.data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePinSession();
    const payload = await parseJson(request, categorySchema);
    const result = await getSupabaseAdmin()
      .from("categories")
      .insert(payload)
      .select()
      .single();
    assertSupabaseResult(result, "Gagal membuat kategori.");
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
