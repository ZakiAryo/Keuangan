import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ATTACHMENT_BUCKET } from "@/lib/attachment-config";
import { parseJson, transactionSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const select =
  "*, category:categories(id,name,color,type,payment_method), wallet:wallets(id,name,color)";

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
    const supabase = getSupabaseAdmin();
    const transactionResult = await supabase
      .from("transactions")
      .select("attachment_path")
      .eq("id", id)
      .single();
    assertSupabaseResult(transactionResult, "Transaksi tidak ditemukan.");
    if (!transactionResult.data) {
      throw new Error("Transaksi tidak ditemukan.");
    }
    const attachmentPath = transactionResult.data.attachment_path;

    const result = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);
    assertSupabaseResult(result, "Gagal menghapus transaksi.");

    if (attachmentPath) {
      const removeResult = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .remove([attachmentPath]);
      if (removeResult.error) {
        console.error("Gagal menghapus lampiran transaksi:", removeResult.error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
