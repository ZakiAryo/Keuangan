import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requirePinSession } from "@/lib/api";
import { getReportData } from "@/lib/finance-data";
import { getSupabaseAdmin } from "@/lib/supabase";
import { assertSupabaseResult } from "@/lib/api";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    await requirePinSession();
    const from = request.nextUrl.searchParams.get("from") ?? "2000-01-01";
    const to = request.nextUrl.searchParams.get("to") ?? "2999-12-31";
    const paymentMethod = request.nextUrl.searchParams.get("payment_method");
    await getReportData(
      from,
      to,
      paymentMethod === "cash" || paymentMethod === "non_cash"
        ? paymentMethod
        : undefined,
    );

    const result = await getSupabaseAdmin()
      .from("transactions")
      .select("*, category:categories(name,payment_method), wallet:wallets(name)")
      .gte("transaction_date", from)
      .lte("transaction_date", to)
      .order("transaction_date", { ascending: false });
    assertSupabaseResult(result, "Gagal mengekspor CSV.");

    const data = (result.data ?? []).filter((item) => {
      if (paymentMethod !== "cash" && paymentMethod !== "non_cash") return true;
      return (
        (
          item.category as unknown as { payment_method?: string } | null
        )?.payment_method === paymentMethod
      );
    });
    const rows = [
      [
        "Tanggal",
        "Tipe",
        "Deskripsi",
        "Kategori",
        "Metode Pembayaran",
        "Wallet",
        "Jumlah",
        "Catatan",
      ],
      ...data.map((item) => [
        item.transaction_date,
        item.type,
        item.description,
        (item.category as unknown as { name?: string } | null)?.name ?? "",
        (
          item.category as unknown as { payment_method?: string } | null
        )?.payment_method === "cash"
          ? "Cash"
          : "Non-Cash",
        (item.wallet as unknown as { name?: string } | null)?.name ?? "",
        item.amount,
        item.notes ?? "",
      ]),
    ];
    const csv = `\uFEFF${rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")}`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${from}-${to}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
