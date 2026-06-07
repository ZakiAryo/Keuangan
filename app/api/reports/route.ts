import { format, startOfYear } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requirePinSession } from "@/lib/api";
import { getReportData } from "@/lib/finance-data";

export async function GET(request: NextRequest) {
  try {
    await requirePinSession();
    const dateSchema = z.string().date();
    const from = dateSchema.parse(
      request.nextUrl.searchParams.get("from") ??
        format(startOfYear(new Date()), "yyyy-MM-dd"),
    );
    const to = dateSchema.parse(
      request.nextUrl.searchParams.get("to") ?? format(new Date(), "yyyy-MM-dd"),
    );
    return NextResponse.json({ data: await getReportData(from, to) });
  } catch (error) {
    return handleApiError(error);
  }
}
