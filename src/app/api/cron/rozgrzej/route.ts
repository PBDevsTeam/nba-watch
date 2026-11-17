// Codzienne rozgrzewanie cache (Vercel Cron, patrz vercel.json).
//
// 1. Ocenia mecze z ostatnich 3 dni, żeby pierwszy poranny gość nie czekał.
// 2. Liczy ranking bieżącego sezonu: dociąga brakujące oceny w ramach budżetu
//    czasu. Oceny są w cache na stałe, więc po kilku przebiegach (albo od razu,
//    w sezonie z małą liczbą meczów) ranking jest kompletny i podawany z cache.
//
// Vercel wysyła nagłówek `Authorization: Bearer $CRON_SECRET`, gdy zmienna
// CRON_SECRET jest ustawiona w projekcie. Bez niej endpoint działa, ale jego
// praca jest ograniczona budżetem czasu, więc nie da się nim zalać ESPN.

import { NextResponse } from "next/server";
import { getScoreboardDays } from "@/lib/espn";
import { getCachedScores } from "@/lib/scores";
import { getSeasonRanking } from "@/lib/games";
import { currentSeason, shiftDate, todayISO } from "@/lib/dates";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 401 });
  }

  const started = Date.now();
  const today = todayISO();
  const recent = (await getScoreboardDays(shiftDate(today, -3), today)).filter(
    (g) => g.status === "final"
  );
  const scored = await getCachedScores(
    recent.map((g) => g.id),
    { deadline: started + 8_000 }
  );

  const ranking = await getSeasonRanking(currentSeason());

  return NextResponse.json({
    ostatnieDni: { mecze: recent.length, ocenione: scored.size },
    ranking: { sezon: ranking.season, druzyny: ranking.rows.length, kompletny: ranking.complete },
    czasMs: Date.now() - started,
  });
}
