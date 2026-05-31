import { NextResponse } from "next/server";
import { getReveal } from "@/lib/games";

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
    return NextResponse.json(reveal, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Nie udało się pobrać szczegółów meczu" },
      { status: 502 }
    );
  }
}
