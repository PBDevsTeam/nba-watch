import { getPreviewsForDate } from "@/lib/games";
import { normalizeDate, formatPl } from "@/lib/dates";
import type { GamePreview } from "@/lib/types";
import { DateNav } from "@/components/DateNav";
import { GameCard } from "@/components/GameCard";

export const dynamic = "force-dynamic";

const LEGEND = [
  { emoji: "🔥", label: "85+", color: "#ff3b30" },
  { emoji: "🟢", label: "70+", color: "#34c759" },
  { emoji: "🟡", label: "55+", color: "#ffcc00" },
  { emoji: "🟠", label: "40+", color: "#ff9500" },
  { emoji: "⚪", label: "<40", color: "#8a8a8f" },
];

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
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-20">
      {/* hero */}
      <header className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.25em] text-faint mb-5">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-accent/60" />
          Wskaźnik oglądalności NBA
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-accent/60" />
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-extrabold tracking-tight leading-[0.95]">
          Czy warto{" "}
          <span className="bg-gradient-to-r from-accent via-accent-soft to-accent-2 bg-clip-text text-transparent">
            obejrzeć
          </span>
          ?
        </h1>
        <p className="mt-5 text-muted max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Sprawdź jak dobry był mecz, zanim poznasz wynik. Wskaźnik 0–100 liczy
          dramaturgię, dogrywki i gwiazdorskie występy — bez spoilerów.
        </p>

        {/* legenda poziomów */}
        <div className="mt-7 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          {LEGEND.map((l) => (
            <span
              key={l.label}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: l.color, boxShadow: `0 0 8px ${l.color}99` }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </header>

      {/* nawigacja datą */}
      <div className="mb-4">
        <DateNav date={date} />
      </div>
      <p className="text-center text-xs text-faint mb-10 capitalize">
        {formatPl(date)}
        {!error && previews.length > 0 && (
          <span className="lowercase"> · {previews.length} meczów</span>
        )}
      </p>

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
        <section className="space-y-4">
          {previews.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}
            >
              <GameCard preview={p} />
            </div>
          ))}
        </section>
      )}

      <footer className="mt-24 text-center text-xs text-faint">
        Dane: ESPN · Wskaźnik autorski (Tier A) · NBA Watch
      </footer>
    </main>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="glass rounded-[var(--radius-card)] py-20 text-center">
      <p className="font-display text-xl font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted max-w-sm mx-auto">{desc}</p>
    </div>
  );
}
