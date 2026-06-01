import Link from "next/link";
import type { Metadata } from "next";
import { getTeamSeason } from "@/lib/games";
import { SiteHeader } from "@/components/SiteHeader";
import { formatShortPl } from "@/lib/dates";

export const dynamic = "force-dynamic";

// domyślny sezon = bieżący sezon NBA (rok zakończenia). NBA 2024/25 -> 2025.
const SEASON = 2025;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { team } = await getTeamSeason(id, SEASON);
    return {
      title: `${team.name} — najlepsze mecze`,
      description: `Najlepsze mecze ${team.name} w sezonie wg wskaźnika oglądalności.`,
    };
  } catch {
    return { title: "Drużyna" };
  }
}

function col(c: string | null, fb: string) {
  if (!c) return fb;
  return c.startsWith("#") ? c : `#${c}`;
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let view;
  try {
    view = await getTeamSeason(id, SEASON);
  } catch {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader active="druzyny" />
        <main className="w-[92%] max-w-[1600px] mx-auto flex-1 py-16 text-center">
          <p className="font-display text-lg font-bold">Nie udało się pobrać drużyny</p>
          <Link href="/druzyny" className="text-accent text-sm mt-2 inline-block">
            ← Wróć do listy drużyn
          </Link>
        </main>
      </div>
    );
  }

  const { team, games, avgScore, bestScore, played } = view;
  const accent = col(team.color, "#ff6b2c");

  const stats = [
    { label: "Rozegrane", value: played },
    { label: "Najlepszy", value: bestScore },
    { label: "Średnia", value: avgScore },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader active="druzyny" />
      <main className="w-[92%] max-w-[1600px] mx-auto flex-1 py-6 lg:py-8">
        <Link
          href="/druzyny"
          className="text-sm text-muted hover:text-text transition-colors inline-block mb-4"
        >
          ← Wszystkie drużyny
        </Link>

        {/* nagłówek drużyny */}
        <div
          className="border border-border rounded-md bg-surface p-5 flex items-center gap-4 mb-3 relative overflow-hidden"
          style={{ background: `linear-gradient(110deg, ${accent}22, transparent 60%)` }}
        >
          {team.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logo} alt="" className="h-16 w-16 shrink-0" />
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold leading-tight">
              {team.name}
            </h1>
            <p className="text-sm text-muted">Sezon {SEASON - 1}/{String(SEASON).slice(2)} · najlepsze mecze</p>
          </div>
        </div>

        {/* statystyki sezonu */}
        <div className="grid grid-cols-3 gap-px bg-border border border-border rounded-md overflow-hidden mb-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface px-3 py-3 text-center">
              <div className="font-display text-2xl font-black tabular-nums text-accent leading-none">
                {s.value}
              </div>
              <div className="text-[11px] text-faint uppercase tracking-wide mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* lista meczów */}
        {games.length === 0 ? (
          <div className="border border-border rounded-md bg-surface py-16 text-center">
            <p className="text-muted">Brak rozegranych meczów w tym sezonie.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-px bg-border border border-border rounded-md overflow-hidden">
            {games.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/?date=${g.dateISO}`}
                  className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3.5 bg-surface hover:bg-surface-hover transition-colors"
                >
                  <span
                    className="grid place-items-center rounded-md shrink-0 font-display font-black text-bg tabular-nums"
                    style={{ width: 48, height: 48, background: g.tier.color, fontSize: 20 }}
                  >
                    {g.watchScore}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2.5">
                    <span className="text-xs text-faint w-12 shrink-0">
                      {g.isHome ? "vs" : "@"}
                    </span>
                    {g.opponent.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.opponent.logo} alt="" className="h-7 w-7 shrink-0" />
                    )}
                    <span className="font-display font-bold">{g.opponent.abbreviation}</span>
                    <span className="text-sm text-muted truncate hidden sm:block">
                      {g.opponent.shortName}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold shrink-0"
                    style={{ color: g.tier.color }}
                  >
                    {g.tier.label}
                  </span>
                  <span className="font-mono text-xs text-faint shrink-0 w-20 text-right hidden sm:block">
                    {formatShortPl(g.dateISO)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
