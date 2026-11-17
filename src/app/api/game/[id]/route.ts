import { NextResponse } from "next/server";
import { GameNotFinished, getReveal } from "@/lib/games";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Nieprawidłowe id meczu" }, { status: 400 });
  }
  try {
    const reveal = await getReveal(id);
    // Zakończony mecz się nie zmienia: CDN może go trzymać długo.
    return NextResponse.json(reveal, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (e) {
    if (e instanceof GameNotFinished) {
      return NextResponse.json(
        { error: "Mecz jeszcze się nie zakończył" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "ESPN nie odpowiedział. Spróbuj ponownie za chwilę." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
