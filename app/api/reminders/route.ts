import { NextRequest, NextResponse } from "next/server";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { paymentReminderSchema, parseJson } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await requirePinSession();
    const status = request.nextUrl.searchParams.get("status");
    let query = getSupabaseAdmin()
      .from("payment_reminders")
      .select("*")
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (status === "pending" || status === "paid") {
      query = query.eq("status", status);
    }

    const result = await query;
    assertSupabaseResult(result, "Gagal mengambil reminder.");
    const data = (result.data ?? []).map((item) => ({
      ...item,
      amount: item.amount === null ? null : toNumber(item.amount),
    }));
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePinSession();
    const payload = await parseJson(request, paymentReminderSchema);
    const status = payload.status ?? "pending";
    const result = await getSupabaseAdmin()
      .from("payment_reminders")
      .insert({
        ...payload,
        amount: payload.amount ?? null,
        notes: payload.notes || null,
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();
    assertSupabaseResult(result, "Gagal menyimpan reminder.");
    return NextResponse.json(
      {
        data: result.data
          ? {
              ...result.data,
              amount:
                result.data.amount === null
                  ? null
                  : toNumber(result.data.amount),
            }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
