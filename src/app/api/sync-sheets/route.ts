import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint syncs today's transactions to Google Sheets
// Call via cron or manually: POST /api/sync-sheets
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!sheetId || !apiKey) {
    return NextResponse.json({ error: "Google Sheets not configured" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, products(nama, kategori)")
    .gte("tanggal", today);

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ message: "No transactions today" });
  }

  // Format rows for Google Sheets
  const rows = transactions.map((t) => [
    new Date(t.tanggal).toLocaleDateString("id-ID"),
    (t.products as { nama: string })?.nama || "",
    (t.products as { kategori: string })?.kategori || "",
    t.harga_modal,
    t.harga_jual,
    t.margin,
    t.jumlah,
    t.total_kotor,
    t.total_bersih,
  ]);

  // Append to Google Sheets using Sheets API v4
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:I:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values: rows }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ synced: rows.length });
}
