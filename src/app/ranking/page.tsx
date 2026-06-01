import Link from "next/link";
import type { Metadata } from "next";
import { getSeasonRanking } from "@/lib/games";
import type { RankingRow } from "@/lib/games";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SEASON = 2025;

export const metadata: Metadata = {
  title: "Ranking drużyn",
  description:
    "Które drużyny NBA dostarczają najbardziej emocjonujących meczów w sezonie — ranking wg średniego wskaźnika oglądalności.",
};

function tierColor(score: number): string {
  if (score >= 85) return "var(--color-t-must)";
  if (score >= 70) return "var(--color-t-great)";
  if (score >= 55) return "var(--color-t-good)";
  if (score >= 40) return "var(--color-t-avg)";
  return "var(--color-t-skip)";
}

export default async function RankingPage() {
  let rows: RankingRow[] = [];
  let error = false;
  try {
    rows = await getSeasonRanking(SEASON);
  } catch {
    error = true;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader active="ranking" />
      <main className="w-[92%] max-w-[1600px] mx-auto flex-1 py-6 lg:py-8">
        <h1 className="font-display text-2xl font-extrabold mb-1">
          Ranking drużyn
        </h1>
        <p className="text-muted text-sm mb-6">
          Które drużyny dostarczają najlepszych widowisk — wg średniego wskaźnika
          oglądalności ich meczów w sezonie {SEASON - 1}/{String(SEASON).slice(2)}.
        </p>

        {error || rows.length === 0 ? (
          <div className="border border-border rounded-md bg-surface py-16 text-center">
            <p className="font-display text-lg font-bold">Nie udało się zbudować rankingu</p>
            <p className="text-sm text-muted mt-1">Spróbuj odświeżyć stronę.</p>
          </div>
        ) : (
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            {/* nagłówek tabeli */}
            <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem] gap-3 px-4 py-2.5 border-b border-border bg-surface-hover text-[11px] uppercase tracking-wider text-faint font-semibold">
              <span className="text-center">#</span>
              <span>Drużyna</span>
              <span className="text-right">Średnia</span>
              <span className="text-right">Najlepszy</span>
              <span className="text-right">Hitów</span>
            </div>
            <ul>
              {rows.map((r, i) => (
                <li key={r.team.id}>
                  <Link
                    href={`/druzyna/${r.team.id}`}
                    className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[3rem_1fr_5rem_5rem_5rem] gap-3 items-center px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border/60 last:border-0"
                  >
                    <span className="font-mono text-sm text-faint text-center tabular-nums">
                      {i + 1}
                    </span>
                    <span className="flex items-center gap-2.5 min-w-0">
                      {r.team.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.team.logo} alt="" className="h-7 w-7 shrink-0" />
                      )}
                      <span className="font-display font-bold shrink-0">
                        {r.team.abbreviation}
                      </span>
                      <span className="text-sm text-muted truncate hidden md:block">
                        {r.team.shortName}
                      </span>
                    </span>
                    {/* mobile: tylko średnia jako blok; desktop: 3 kolumny */}
                    <span
                      className="sm:hidden grid place-items-center rounded-md font-display font-black text-bg tabular-nums justify-self-end"
                      style={{ width: 40, height: 40, background: tierColor(r.avgScore), fontSize: 16 }}
                    >
                      {r.avgScore}
                    </span>
                    <span
                      className="hidden sm:block text-right font-mono font-bold tabular-nums text-lg"
                      style={{ color: tierColor(r.avgScore) }}
                    >
                      {r.avgScore}
                    </span>
                    <span className="hidden sm:block text-right font-mono tabular-nums text-muted">
                      {r.bestScore}
                    </span>
                    <span className="hidden sm:block text-right font-mono tabular-nums text-muted">
                      {r.mustWatch}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
