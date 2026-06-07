import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SESSION_COOKIE, verifyPinSession } from "@/lib/session";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function requirePinSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const isValid = await verifyPinSession(
    token,
    process.env.PIN_SESSION_SECRET,
  );

  if (!isValid) {
    throw new ApiError(401, "Sesi PIN tidak valid atau sudah berakhir.");
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Data tidak valid.", details: error.flatten() },
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  }

  const message =
    error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
  console.error(error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function assertSupabaseResult(
  result: { error: { message: string; details?: string } | null },
  fallbackMessage: string,
) {
  if (result.error) {
    throw new ApiError(
      500,
      formatSupabaseError(result.error.message || fallbackMessage),
      result.error.details,
    );
  }
}

export function formatSupabaseError(message: string) {
  if (
    /column transactions\.attachment_(path|name|type|size) does not exist/i.test(
      message,
    )
  ) {
    return [
      "Fitur lampiran belum aktif di database.",
      "Jalankan supabase/migrations/20260607_add_transaction_attachments.sql",
      "melalui Supabase SQL Editor, lalu muat ulang aplikasi.",
    ].join(" ");
  }

  if (
    /relation ['"]?public\.payment_reminders['"]? does not exist/i.test(
      message,
    ) ||
    /could not find the table ['"]?public\.payment_reminders/i.test(message)
  ) {
    return [
      "Fitur reminder belum aktif di database.",
      "Jalankan supabase/migrations/20260607_add_payment_reminders.sql",
      "melalui Supabase SQL Editor, lalu muat ulang aplikasi.",
    ].join(" ");
  }

  if (/column budgets\.(start_date|end_date) does not exist/i.test(message)) {
    return [
      "Fitur rentang tanggal budget belum aktif di database.",
      "Jalankan supabase/migrations/20260607_update_budget_date_range.sql",
      "melalui Supabase SQL Editor, lalu muat ulang aplikasi.",
    ].join(" ");
  }

  return message;
}
