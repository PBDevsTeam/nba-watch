import Link from "next/link";
import type { Metadata } from "next";
import { getTeams } from "@/lib/games";
import type { TeamInfo } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drużyny NBA",
  description:
    "Wybierz drużynę NBA i zobacz jej najlepsze mecze sezonu wg wskaźnika oglądalności.",
};

function col(c: string | null, fb: string) {
  if (!c) return fb;
  return c.startsWith("#") ? c : `#${c}`;
}

export default async function TeamsPage() {
  let teams: TeamInfo[] = [];
  let error = false;
  try {
    teams = await getTeams();
  } catch {
    error = true;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="w-[92%] max-w-[1600px] mx-auto flex-1 py-6 lg:py-8">
        <h1 className="font-display text-2xl font-extrabold mb-1">Drużyny</h1>
        <p className="text-muted text-sm mb-6">
          Wybierz drużynę, by zobaczyć jej najlepsze mecze tego sezonu.
        </p>

        {error || teams.length === 0 ? (
          <div className="border border-border rounded-md bg-surface py-16 text-center">
            <p className="font-display text-lg font-bold">Nie udało się pobrać drużyn</p>
            <p className="text-sm text-muted mt-1">Spróbuj odświeżyć stronę.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-border rounded-md overflow-hidden">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/druzyna/${t.id}`}
                className="group bg-surface hover:bg-surface-hover transition-colors p-4 flex items-center gap-3 relative"
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-1 opacity-70"
                  style={{ background: col(t.color, "#ff6b2c") }}
                />
                {t.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo} alt="" className="h-9 w-9 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm group-hover:text-accent transition-colors">
                    {t.abbreviation}
                  </div>
                  <div className="text-xs text-muted truncate">{t.shortName}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
