import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getTeamSeason } from "@/lib/games";
import type { TeamSeasonView } from "@/lib/games";
import { formatShortPl, normalizeSeason, seasonLabel, selectableSeasons } from "@/lib/dates";
import { getTeams } from "@/lib/espn";
import { teamColor } from "@/lib/logo";
import { SiteFooter } from "@/components/AppShell";
import { EmptyState, PartialNotice } from "@/components/blocks";
import { ContextChip, ScoreBlock, TeamLogo, TierText } from "@/components/ui";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ sezon?: string; widok?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  try {
    const team = (await getTeams()).find((t) => t.id === id);
    if (!team) return { title: "Drużyna" };
    return {
      title: `${team.name}: mecze warte obejrzenia`,
      description: `Wszystkie mecze ${team.name} w sezonie z oceną 0–100, bez zdradzania wyników.`,
    };
  } catch {
    return { title: "Drużyna" };
  }
}

function Segmented({
  items,
}: {
  items: { href: string; label: string; active: boolean }[];
}) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-surface-2">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`h-9 px-3.5 rounded-lg text-sm font-semibold inline-flex items-center transition-colors ${
            it.active ? "bg-surface-hover text-text" : "text-faint hover:text-muted"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export default async function TeamPage({ params, searchParams }: Params) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^\d+$/.test(id)) {
    return (
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-10">
        <EmptyState title="Nie ma takiej drużyny" action={{ href: "/druzyny", label: "Wszystkie drużyny" }} />
      </main>
    );
  }
  const season = normalizeSeason(sp.sezon);
  const byScore = sp.widok !== "kolejno";

  let view: TeamSeasonView;
  try {
    view = await getTeamSeason(id, season);
  } catch {
    return (
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-10">
        <EmptyState title="Nie udało się wczytać drużyny" action={{ href: "/druzyny", label: "Wszystkie drużyny" }}>
          ESPN nie odpowiedział. Odśwież stronę za chwilę.
        </EmptyState>
      </main>
    );
  }

  const { team, games } = view;
  const accent = teamColor(team.color, "#36406a");
  const list = byScore ? [...games].sort((a, b) => b.watchScore - a.watchScore) : games;
  const mustWatch = games.filter((g) => g.watchScore >= 85).length;
  const href = (s: number, w: string) => {
    const q = new URLSearchParams();
    if (s !== selectableSeasons()[0]) q.set("sezon", String(s));
    if (w !== "najlepsze") q.set("widok", w);
    const qs = q.toString();
    return `/druzyna/${id}${qs ? `?${qs}` : ""}`;
  };

  const stats = [
    { label: "Średnia ocena", value: view.rated ? view.avgScore : "–" },
    { label: "Najlepszy mecz", value: view.rated ? view.bestScore : "–" },
    { label: "Obowiązkowe", value: mustWatch },
    { label: "Rozegrane", value: view.played },
  ];

  return (
    <>
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
        <Link href="/druzyny" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text mb-5">
          <ArrowLeft size={16} aria-hidden /> Wszystkie drużyny
        </Link>

        <header
          className="relative overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface"
          style={{ borderTop: `4px solid ${accent}` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-7">
            <TeamLogo team={team} size={88} />
            <div className="min-w-0">
              <h1 className="font-display text-[40px] sm:text-[52px] font-black leading-[0.92] tracking-tight">
                {team.name}
              </h1>
              <p className="mt-2 text-muted">Mecze sezonu {seasonLabel(season)} z oceną, łącznie z play-off</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border-t border-line">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface px-5 py-4">
                <dt className="text-sm text-faint">{s.label}</dt>
                <dd className="font-display text-4xl font-black tabular-nums leading-none mt-1.5">{s.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            items={selectableSeasons().map((s) => ({
              href: href(s, byScore ? "najlepsze" : "kolejno"),
              label: seasonLabel(s),
              active: s === season,
            }))}
          />
          <Segmented
            items={[
              { href: href(season, "najlepsze"), label: "Najlepsze", active: byScore },
              { href: href(season, "kolejno"), label: "Po kolei", active: !byScore },
            ]}
          />
        </div>

        <div className="space-y-4">
          <PartialNotice done={view.rated} total={view.played} />
          {games.length === 0 ? (
            <EmptyState title="Ten sezon jeszcze się nie zaczął">
              {view.played === 0
                ? "Drużyna nie rozegrała jeszcze żadnego meczu. Zajrzyj do poprzedniego sezonu."
                : "Oceny liczą się w tle. Odśwież stronę za minutę."}
            </EmptyState>
          ) : (
            <ol className="rounded-[var(--radius-panel)] bg-surface border border-line divide-y divide-line overflow-hidden">
              {list.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/?date=${g.dateISO}#mecz-${g.id}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 sm:gap-6 px-4 sm:px-5 py-3.5 hover:bg-surface-hover transition-colors"
                  >
                    <ScoreBlock score={g.watchScore} tier={g.tier} size="md" />
                    <span className="min-w-0 flex items-center gap-3">
                      <span className="text-sm text-faint w-5 text-center shrink-0">{g.isHome ? "vs" : "@"}</span>
                      <TeamLogo team={g.opponent} size={32} />
                      <span className="min-w-0">
                        <span className="block font-display text-[22px] font-extrabold leading-none">
                          {g.opponent.abbreviation}
                        </span>
                        <span className="block text-sm text-muted truncate mt-1">{g.opponent.shortName}</span>
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1.5">
                      <TierText tier={g.tier} className="text-[15px] text-right" />
                      <span className="flex items-center gap-2">
                        <ContextChip context={g.context} />
                        <span className="text-sm text-faint whitespace-nowrap">{formatShortPl(g.dateISO)}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
