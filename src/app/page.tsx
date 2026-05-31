import { getPreviewsForDate } from "@/lib/games";
import { normalizeDate } from "@/lib/dates";
import type { GamePreview } from "@/lib/types";
import { DateNav } from "@/components/DateNav";
import { GameCard } from "@/components/GameCard";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const date = normalizeDate(sp.date);

  let previews: GamePreview[] = [];
  let error = false;
  try {
    previews = await getPreviewsForDate(date);
  } catch {
    error = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
      {/* hero */}
      <header className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-faint mb-4">
          <span className="h-px w-8 bg-border-strong" />
          Wskaźnik oglądalności NBA
          <span className="h-px w-8 bg-border-strong" />
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight">
          Czy warto <span className="text-accent">obejrzeć</span>?
        </h1>
        <p className="mt-4 text-muted max-w-xl mx-auto text-sm sm:text-base">
          Sprawdź jak dobry był mecz, zanim poznasz wynik. Wskaźnik 0–100 liczy
          dramaturgię, dogrywki i gwiazdorskie występy — bez spoilerów.
        </p>
      </header>

      {/* nawigacja datą */}
      <div className="mb-10">
        <DateNav date={date} />
      </div>

      {/* stany */}
      {error ? (
        <EmptyState
          title="Nie udało się pobrać meczów"
          desc="Problem z połączeniem ze źródłem danych. Spróbuj odświeżyć stronę."
        />
      ) : previews.length === 0 ? (
        <EmptyState
          title="Brak zakończonych meczów tego dnia"
          desc="Wybierz inną datę — strzałkami lub klikając w datę powyżej."
        />
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {previews.map((p) => (
            <GameCard key={p.id} preview={p} />
          ))}
        </section>
      )}

      <footer className="mt-20 text-center text-xs text-faint">
        Dane: ESPN · Wskaźnik autorski (Tier A) · NBA Watch
      </footer>
    </main>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border py-20 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted max-w-sm mx-auto">{desc}</p>
    </div>
  );
}
