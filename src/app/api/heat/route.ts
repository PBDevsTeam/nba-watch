import { NextResponse } from "next/server";
import { getDayHeat } from "@/lib/games";
import { daysBetween, todayISO } from "@/lib/dates";

export const maxDuration = 60;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Najdłuższy zakres: siatka miesiąca to najwyżej 6 tygodni. */
const MAX_DAYS = 42;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  let to = searchParams.get("to") ?? "";
  if (!ISO.test(from) || !ISO.test(to) || from > to) {
    return NextResponse.json({ error: "Nieprawidłowy zakres dat" }, { status: 400 });
  }
  const today = todayISO();
  if (to > today) to = today;
  if (from > to) return NextResponse.json({ heat: {}, complete: true });
  if (daysBetween(from, to) > MAX_DAYS) {
    return NextResponse.json(
      { error: `Zakres może mieć najwyżej ${MAX_DAYS} dni` },
      { status: 400 }
    );
  }

  try {
    const data = await getDayHeat(from, to);
    // Pełny wynik dla dni sprzed 2+ dni jest stały; niepełny albo świeży krótko.
    const settled = data.complete && daysBetween(to, today) >= 2;
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": settled
          ? "public, s-maxage=86400, stale-while-revalidate=604800"
          : "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "ESPN nie odpowiedział" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
