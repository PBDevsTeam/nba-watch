import { NextResponse } from "next/server";
import { getDayHeat } from "@/lib/games";

export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "Nieprawidłowy zakres dat" }, { status: 400 });
  }
  try {
    const heat = await getDayHeat(from, to);
    return NextResponse.json(
      { heat },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 502 });
  }
}
