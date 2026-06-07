import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson, paymentReminderUpdateSchema } from "@/lib/validation";
import { toNumber } from "@/lib/utils";
import type { Database } from "@/types/database";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const payload = await parseJson(request, paymentReminderUpdateSchema);
    const update: Database["public"]["Tables"]["payment_reminders"]["Update"] =
      { ...payload };

    if ("amount" in payload) update.amount = payload.amount ?? null;
    if ("notes" in payload) update.notes = payload.notes || null;
    if (payload.status) {
      update.paid_at =
        payload.status === "paid" ? new Date().toISOString() : null;
    }

    const result = await getSupabaseAdmin()
      .from("payment_reminders")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (result.error?.code === "PGRST116") {
      throw new ApiError(404, "Reminder tidak ditemukan.");
    }
    assertSupabaseResult(result, "Gagal memperbarui reminder.");
    return NextResponse.json({
      data: result.data
        ? {
            ...result.data,
            amount:
              result.data.amount === null ? null : toNumber(result.data.amount),
          }
        : null,
    });
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
      .from("payment_reminders")
      .delete()
      .eq("id", id);
    assertSupabaseResult(result, "Gagal menghapus reminder.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
