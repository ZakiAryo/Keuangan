import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson } from "@/lib/validation";
import type { Json } from "@/types/database";

const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: z.object({
    categories: z.array(z.record(z.unknown())),
    wallets: z.array(z.record(z.unknown())),
    transactions: z.array(z.record(z.unknown())),
    budgets: z.array(z.record(z.unknown())),
    wallet_transfers: z.array(z.record(z.unknown())),
  }),
});

export async function POST(request: Request) {
  try {
    await requirePinSession();
    const payload = await parseJson(request, backupSchema);
    const result = await getSupabaseAdmin().rpc("restore_finance_backup", {
      payload: payload as unknown as Json,
    });
    assertSupabaseResult(result, "Restore backup gagal.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
