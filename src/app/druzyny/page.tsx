import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { conferenceOf, getTeams } from "@/lib/games";
import type { TeamInfo } from "@/lib/types";
import { teamColor } from "@/lib/logo";
import { SiteFooter } from "@/components/AppShell";
import { EmptyState } from "@/components/blocks";
import { TeamLogo } from "@/components/ui";

// Dynamicznie: lista drużyn i tak jest w cache fetch przez dobę (lib/espn.ts),
// a prerender przy buildzie utrwaliłby komunikat o błędzie, gdyby ESPN akurat nie odpowiadał.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drużyny",
  description: "Wybierz drużynę NBA i zobacz, które jej mecze w tym sezonie warto obejrzeć.",
};

function TeamList({ title, teams }: { title: string; teams: TeamInfo[] }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold mb-3">{title}</h2>
      <ul className="rounded-[var(--radius-panel)] bg-surface border border-line divide-y divide-line overflow-hidden">
        {teams.map((t) => (
          <li key={t.id}>
            <Link
              href={`/druzyna/${t.id}`}
              className="group flex items-center gap-4 pl-0 pr-4 h-16 hover:bg-surface-hover transition-colors"
            >
              <span className="self-stretch w-1" style={{ background: teamColor(t.color) }} aria-hidden />
              <TeamLogo team={t} size={36} />
              <span className="min-w-0">
                <span className="block font-semibold leading-tight truncate">{t.name}</span>
                <span className="block text-sm text-faint">{t.abbreviation}</span>
              </span>
              <ChevronRight
                size={18}
                className="ml-auto text-faint group-hover:text-text transition-colors"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function TeamsPage() {
  let teams: TeamInfo[] = [];
  try {
    teams = await getTeams();
  } catch {
    // pusta lista -> komunikat niżej
  }

  const east = teams.filter((t) => conferenceOf(t.abbreviation) === "east");
  const west = teams.filter((t) => conferenceOf(t.abbreviation) !== "east");

  return (
    <>
      <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
        <h1 className="font-display text-[40px] sm:text-[52px] font-black leading-[0.92] tracking-tight">
          Drużyny
        </h1>
        <p className="mt-3 mb-8 text-muted max-w-xl">
          Wybierz drużynę, żeby zobaczyć wszystkie jej mecze w sezonie z oceną. Najlepsze
          spotkania do nadrobienia znajdziesz na górze listy.
        </p>
        {teams.length === 0 ? (
          <EmptyState title="Nie udało się wczytać drużyn">
            ESPN nie odpowiedział. Odśwież stronę za chwilę.
          </EmptyState>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <TeamList title="Konferencja Wschodnia" teams={east} />
            <TeamList title="Konferencja Zachodnia" teams={west} />
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
