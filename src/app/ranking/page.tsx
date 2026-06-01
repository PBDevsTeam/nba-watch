import Link from "next/link";
import type { Metadata } from "next";
import { getSeasonRanking, getTopGames } from "@/lib/games";
import type { RankingRow, TopGame } from "@/lib/games";
import { SiteHeader } from "@/components/SiteHeader";
import { todayISO, shiftDate, formatShortPl } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SEASON = 2025;

export const metadata: Metadata = {
  title: "Ranking drużyn",
  description:
    "Które drużyny NBA dostarczają najbardziej emocjonujących meczów w sezonie, oraz top mecze do obejrzenia.",
};

function tierColor(score: number): string {
  if (score >= 85) return "var(--color-t-must)";
  if (score >= 70) return "var(--color-t-great)";
  if (score >= 55) return "var(--color-t-good)";
  if (score >= 40) return "var(--color-t-avg)";
  return "var(--color-t-skip)";
}

function col(c: string | null, fb: string) {
  if (!c) return fb;
  return c.startsWith("#") ? c : `#${c}`;
}

export default async function RankingPage() {
  let rows: RankingRow[] = [];
  let top: TopGame[] = [];
  let error = false;
  try {
    const today = todayISO();
    [rows, top] = await Promise.all([
      getSeasonRanking(SEASON),
      getTopGames(shiftDate(today, -14), today, 10),
    ]);
  } catch {
    error = true;
  }

  const east = rows.filter((r) => r.conference === "east");
  const west = rows.filter((r) => r.conference === "west");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader active="ranking" />
      <main className="w-[92%] max-w-[1600px] mx-auto flex-1 py-6 lg:py-8">
        <h1 className="font-display text-2xl font-extrabold mb-1">Ranking</h1>
        <p className="text-muted text-sm mb-6">
          Najlepsze mecze do nadrobienia i drużyny, które dostarczają najwięcej
          emocji w sezonie {SEASON - 1}/{String(SEASON).slice(2)}.
        </p>

        {error || rows.length === 0 ? (
          <div className="border border-border rounded-md bg-surface py-16 text-center">
            <p className="font-display text-lg font-bold">Nie udało się zbudować rankingu</p>
            <p className="text-sm text-muted mt-1">Spróbuj odświeżyć stronę.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* TOP 10 MECZÓW */}
            {top.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-accent">▸</span> Top mecze do obejrzenia
                  <span className="text-xs font-normal text-faint normal-case tracking-normal">
                    · ostatnie 14 dni
                  </span>
                </h2>
                <ol className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border rounded-md overflow-hidden">
                  {top.map((g, i) => (
                    <li key={g.id}>
                      <Link
                        href={`/?date=${g.dateISO}`}
                        className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-hover transition-colors"
                      >
                        <span className="font-mono text-sm text-faint w-5 text-center shrink-0 tabular-nums">
                          {i + 1}
                        </span>
                        <span
                          className="grid place-items-center rounded-md shrink-0 font-display font-black text-bg tabular-nums"
                          style={{ width: 44, height: 44, background: g.tier.color, fontSize: 18 }}
                        >
                          {g.watchScore}
                        </span>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {g.away.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.away.logo} alt="" className="h-6 w-6 shrink-0" />
                          )}
                          <span className="font-display font-bold text-sm">{g.away.abbreviation}</span>
                          <span className="text-faint text-xs">@</span>
                          {g.home.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.home.logo} alt="" className="h-6 w-6 shrink-0" />
                          )}
                          <span className="font-display font-bold text-sm">{g.home.abbreviation}</span>
                        </div>
                        <span className="font-mono text-xs text-faint shrink-0 hidden sm:block">
                          {formatShortPl(g.dateISO)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* PODIUM drużyn */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-accent">▸</span> Najbardziej widowiskowe drużyny
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {rows.slice(0, 3).map((r, i) => {
                  const accent = col(r.team.color, "#ff6b2c");
                  const medal = ["#ffd24a", "#c7cdd6", "#cd7f4a"][i];
                  return (
                    <Link
                      key={r.team.id}
                      href={`/druzyna/${r.team.id}`}
                      className="border border-border rounded-md bg-surface hover:bg-surface-hover transition-colors p-4 sm:p-5 flex flex-col items-center text-center relative overflow-hidden"
                      style={{ background: `linear-gradient(160deg, ${accent}22, transparent 65%)` }}
                    >
                      <span
                        className="absolute top-2 right-2 font-display font-black text-sm"
                        style={{ color: medal }}
                      >
                        #{i + 1}
                      </span>
                      {r.team.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.team.logo} alt="" className="h-12 w-12 sm:h-16 sm:w-16 mb-2" />
                      )}
                      <span className="font-display font-extrabold text-sm sm:text-base">
                        {r.team.abbreviation}
                      </span>
                      <span className="text-xs text-muted truncate max-w-full hidden sm:block">
                        {r.team.shortName}
                      </span>
                      <span
                        className="font-mono font-black text-2xl sm:text-3xl tabular-nums mt-2"
                        style={{ color: tierColor(r.avgScore) }}
                      >
                        {r.avgScore}
                      </span>
                      <span className="text-[10px] text-faint uppercase tracking-wide">
                        średnia
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* podział na konferencje */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ConferenceTable title="Konferencja Wschodnia" rows={east} />
                <ConferenceTable title="Konferencja Zachodnia" rows={west} />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ConferenceTable({ title, rows }: { title: string; rows: RankingRow[] }) {
  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-surface-hover flex items-center justify-between">
        <h3 className="font-display font-bold text-sm uppercase tracking-wide">{title}</h3>
        <span className="text-[11px] text-faint font-mono">śr · best · hity</span>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.team.id}>
            <Link
              href={`/druzyna/${r.team.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors border-b border-border/60 last:border-0"
            >
              <span className="font-mono text-xs text-faint w-4 text-center shrink-0 tabular-nums">
                {i + 1}
              </span>
              {r.team.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.team.logo} alt="" className="h-8 w-8 shrink-0" />
              )}
              <span className="font-display font-bold shrink-0 w-12">
                {r.team.abbreviation}
              </span>
              <span className="text-sm text-muted truncate flex-1 hidden md:block">
                {r.team.shortName}
              </span>
              <span
                className="font-mono font-bold tabular-nums text-base w-8 text-right shrink-0"
                style={{ color: tierColor(r.avgScore) }}
              >
                {r.avgScore}
              </span>
              <span className="font-mono tabular-nums text-sm text-faint w-8 text-right shrink-0">
                {r.bestScore}
              </span>
              <span className="font-mono tabular-nums text-sm text-faint w-6 text-right shrink-0">
                {r.mustWatch}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
