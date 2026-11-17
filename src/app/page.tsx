import { Suspense } from "react";
import Link from "next/link";
import { getPreviewsForDate, getTopGames } from "@/lib/games";
import { formatPl, formatShortPl, nightTitle, normalizeDate, shiftDate, todayISO } from "@/lib/dates";
import type { WatchTier } from "@/lib/types";
import { DateStrip } from "@/components/DateStrip";
import { GameRow } from "@/components/GameRow";
import { SiteFooter } from "@/components/AppShell";
import { EmptyState, ListSkeleton, NightHeat, TierLegend } from "@/components/blocks";
import { Panel, ScoreBlock, TeamLogo } from "@/components/ui";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function countLabel(n: number): string {
  if (n === 1) return "1 mecz";
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} mecze`;
  return `${n} meczów`;
}

async function Night({ date }: { date: string }) {
  let previews;
  try {
    previews = await getPreviewsForDate(date);
  } catch {
    return (
      <EmptyState title="ESPN nie odpowiada">
        Nie udało się pobrać meczów z tej nocy. Odśwież stronę za chwilę.
      </EmptyState>
    );
  }

  const weekday = formatPl(date).split(",")[0];
  const title = nightTitle(
    date,
    previews.flatMap((p) => (p.startISO ? [p.startISO] : []))
  );

  if (previews.length === 0) {
    return (
      <>
        <h1 className="font-display text-[40px] sm:text-[52px] font-black leading-[0.92] tracking-tight">
          {title}
        </h1>
        <p className="mt-2 mb-6 text-muted">
          <span className="capitalize">{weekday}</span> w USA.
        </p>
        <EmptyState
          title="Tej nocy hala była pusta"
          action={{ href: `/?date=${shiftDate(date, -1)}`, label: "Pokaż poprzednią noc" }}
        >
          Nie rozegrano żadnego meczu NBA. Wybierz inny dzień z paska powyżej albo z kalendarza.
        </EmptyState>
      </>
    );
  }

  const rated = previews.filter((p) => p.tier !== null);
  const worth = rated.filter((p) => (p.watchScore ?? 0) >= 55).length;
  const pending = previews.length - rated.length;
  const tiers = rated.map((p) => p.tier as WatchTier);

  return (
    <>
      <h1 className="font-display text-[40px] sm:text-[52px] font-black leading-[0.92] tracking-tight">
        {title}
      </h1>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="text-muted">
          <span className="capitalize">{weekday}</span> w USA. {countLabel(previews.length)}
          {rated.length > 0 && <>, warte obejrzenia: {worth}</>}
          {pending > 0 && rated.length > 0 && <>, jeszcze bez oceny: {pending}</>}. Godziny
          czasu polskiego.
        </p>
        <NightHeat tiers={tiers} />
      </div>
      <div className="rounded-[var(--radius-panel)] bg-surface border border-line divide-y divide-line">
        {previews.map((p) => (
          <GameRow key={p.id} preview={p} />
        ))}
      </div>
    </>
  );
}

async function RecentBest({ today }: { today: string }) {
  let top;
  try {
    top = await getTopGames(shiftDate(today, -7), today, 5);
  } catch {
    return null;
  }
  if (top.length === 0) return null;
  return (
    <Panel
      title="Najlepsze z ostatnich 7 dni"
      aside={
        <Link href="/ranking" className="text-sm text-muted hover:text-text">
          Ranking
        </Link>
      }
    >
      <ol className="pb-2">
        {top.map((g) => (
          <li key={g.id} className="border-t border-line">
            <Link
              href={`/?date=${g.dateISO}#mecz-${g.id}`}
              className="flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-surface-hover transition-colors"
            >
              <ScoreBlock score={g.watchScore} tier={g.tier} size="sm" />
              <span className="flex items-center gap-1.5 min-w-0">
                <TeamLogo team={g.away} size={20} />
                <span className="font-display text-lg font-extrabold">{g.away.abbreviation}</span>
                <span className="text-faint text-sm">@</span>
                <TeamLogo team={g.home} size={20} />
                <span className="font-display text-lg font-extrabold">{g.home.abbreviation}</span>
              </span>
              <span className="ml-auto text-sm text-faint whitespace-nowrap">{formatShortPl(g.dateISO)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const today = todayISO();
  let date = normalizeDate(sp.date);
  if (date > today) date = today;

  return (
    <>
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] lg:static z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 py-3 lg:pt-6 lg:pb-0 bg-bg/90 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none border-b border-line lg:border-0">
          <DateStrip date={date} today={today} />
        </div>

        <div className="mt-6 lg:mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          <section className="min-w-0">
            <Suspense key={date} fallback={<ListSkeleton />}>
              <Night date={date} />
            </Suspense>
          </section>
          <aside className="space-y-6 lg:sticky lg:top-24">
            <Suspense fallback={<div className="skeleton h-72 rounded-[var(--radius-panel)]" />}>
              <RecentBest today={today} />
            </Suspense>
            <TierLegend />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
