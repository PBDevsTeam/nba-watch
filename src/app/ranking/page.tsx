import Link from "next/link";
import type { Metadata } from "next";
import { getSeasonRanking, getTopGames } from "@/lib/games";
import type { RankingRow, SeasonRanking, TopGame } from "@/lib/games";
import { currentSeason, formatShortPl, seasonLabel, shiftDate, todayISO } from "@/lib/dates";
import { tierForScore } from "@/lib/watchability";
import { SiteFooter } from "@/components/AppShell";
import { EmptyState } from "@/components/blocks";
import { ContextChip, Panel, ScoreBlock, TeamLogo, tierTextVar, tierVar } from "@/components/ui";

// Ranking liczy się z ocen trzymanych w cache (lib/scores.ts) i sam ma cache
// godzinny (lib/games.ts). Strona jest dynamiczna, żeby build nie odpytywał ESPN
// o cały sezon przy każdym wdrożeniu.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Ranking",
  description:
    "Najlepsze mecze NBA z ostatnich dwóch tygodni i drużyny, które w tym sezonie grają najciekawsze spotkania.",
};

function TopGames({ games }: { games: TopGame[] }) {
  return (
    <ol className="grid md:grid-cols-2 gap-px bg-line rounded-[var(--radius-panel)] border border-line overflow-hidden">
      {games.map((g, i) => (
        <li key={g.id} className="bg-surface">
          <Link
            href={`/?date=${g.dateISO}#mecz-${g.id}`}
            className="flex items-center gap-4 px-4 sm:px-5 py-3.5 hover:bg-surface-hover transition-colors h-full"
          >
            <span className="w-5 text-right text-sm text-faint tabular-nums shrink-0">{i + 1}</span>
            <ScoreBlock score={g.watchScore} tier={g.tier} size="md" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <TeamLogo team={g.away} size={24} />
                <span className="font-display text-xl font-extrabold">{g.away.abbreviation}</span>
                <span className="text-faint text-sm">@</span>
                <TeamLogo team={g.home} size={24} />
                <span className="font-display text-xl font-extrabold">{g.home.abbreviation}</span>
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-faint">{formatShortPl(g.dateISO)}</span>
                <ContextChip context={g.context} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function ConferenceTable({ title, rows }: { title: string; rows: RankingRow[] }) {
  const maxAvg = Math.max(1, ...rows.map((r) => r.avgScore));
  return (
    <Panel title={title}>
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-faint text-xs">
            <th className="text-left font-medium pl-4 sm:pl-5 py-2 w-8">#</th>
            <th className="text-left font-medium py-2">Drużyna</th>
            <th className="text-left font-medium py-2 px-2 w-[38%]">Średnia ocena</th>
            <th className="text-right font-medium py-2 px-2 hidden sm:table-cell" title="Najlepszy mecz">
              Najlepszy
            </th>
            <th className="text-right font-medium py-2 pl-2 pr-4 sm:pr-5" title="Mecze z oceną 85+">
              85+
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const tier = tierForScore(r.avgScore);
            return (
              <tr key={r.team.id} className="border-t border-line hover:bg-surface-hover transition-colors">
                <td className="pl-4 sm:pl-5 py-2.5 text-faint">{i + 1}</td>
                <td className="py-2.5">
                  <Link href={`/druzyna/${r.team.id}`} className="flex items-center gap-2.5 min-w-0">
                    <TeamLogo team={r.team} size={26} />
                    <span className="font-display text-lg font-extrabold">{r.team.abbreviation}</span>
                    <span className="text-muted truncate hidden md:inline">{r.team.shortName}</span>
                  </Link>
                </td>
                <td className="py-2.5 px-2">
                  <span className="flex items-center gap-2.5">
                    <span className="font-semibold w-6" style={{ color: tierTextVar(tier.key) }}>
                      {r.avgScore}
                    </span>
                    <span className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(r.avgScore / maxAvg) * 100}%`, background: tierVar(tier.key) }}
                      />
                    </span>
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right text-muted hidden sm:table-cell">{r.bestScore}</td>
                <td className="py-2.5 pl-2 pr-4 sm:pr-5 text-right text-muted">{r.mustWatch}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="h-2" />
    </Panel>
  );
}

export default async function RankingPage() {
  const season = currentSeason();
  const today = todayISO();
  const [rankingRes, topRes] = await Promise.allSettled([
    getSeasonRanking(season),
    getTopGames(shiftDate(today, -14), today, 10),
  ]);
  const ranking: SeasonRanking | null = rankingRes.status === "fulfilled" ? rankingRes.value : null;
  const top: TopGame[] = topRes.status === "fulfilled" ? topRes.value : [];
  const rows = ranking?.rows ?? [];
  const east = rows.filter((r) => r.conference === "east");
  const west = rows.filter((r) => r.conference !== "east");

  return (
    <>
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 space-y-12">
        <div>
          <h1 className="font-display text-[40px] sm:text-[52px] font-black leading-[0.92] tracking-tight">
            Ranking sezonu {seasonLabel(season)}
          </h1>
          <p className="mt-3 text-muted max-w-2xl">
            Mecze z ostatnich dwóch tygodni, które najbardziej warto nadrobić, i drużyny, których
            spotkania w sezonie zasadniczym dają najwięcej emocji.
          </p>
        </div>

        <section>
          <h2 className="font-display text-3xl font-extrabold mb-4">Najlepsze z dwóch tygodni</h2>
          {top.length > 0 ? (
            <TopGames games={top} />
          ) : (
            <EmptyState title="W ostatnich dwóch tygodniach nie było meczów">
              Przerwa w rozgrywkach albo ESPN chwilowo nie odpowiada.
            </EmptyState>
          )}
        </section>

        <section>
          <h2 className="font-display text-3xl font-extrabold mb-1">Drużyny z najciekawszymi meczami</h2>
          <p className="text-muted mb-5">Średnia ocena wszystkich meczów drużyny w sezonie zasadniczym.</p>
          {ranking && !ranking.complete && rows.length > 0 && (
            <p className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
              Część meczów sezonu jeszcze się liczy. Ranking uzupełni się sam, odśwież stronę za kilka
              minut.
            </p>
          )}
          {rows.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 items-start">
              <ConferenceTable title="Wschód" rows={east} />
              <ConferenceTable title="Zachód" rows={west} />
            </div>
          ) : (
            <EmptyState title="Ranking jeszcze się liczy">
              Sezon dopiero się zaczął albo oceny meczów liczą się po raz pierwszy. Zajrzyj za kilka
              minut.
            </EmptyState>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
