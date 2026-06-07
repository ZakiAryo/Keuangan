import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/finance-data";
import { handleApiError, requirePinSession } from "@/lib/api";

export async function GET() {
  try {
    await requirePinSession();
    return NextResponse.json({ data: await getDashboardData() });
  } catch (error) {
    return handleApiError(error);
  }
}
