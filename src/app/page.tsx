import { getPreviewsForDate } from "@/lib/games";
import { normalizeDate, formatPl } from "@/lib/dates";
import type { GamePreview } from "@/lib/types";
import { DateNav } from "@/components/DateNav";
import { GameCard } from "@/components/GameCard";

export const dynamic = "force-dynamic";

const TIERS = [
  { range: "85–100", label: "Obowiązkowo", color: "var(--color-t-must)" },
  { range: "70–84", label: "Bardzo warto", color: "var(--color-t-great)" },
  { range: "55–69", label: "Warto", color: "var(--color-t-good)" },
  { range: "40–54", label: "Przeciętny", color: "var(--color-t-avg)" },
  { range: "0–39", label: "Można odpuścić", color: "var(--color-t-skip)" },
];

const FACTORS = [
  "Dramat końcówki — jak blisko było w ostatnich minutach",
  "Eksplozja punktowa — wybitny występ indywidualny",
  "Wyczyn / rekord — triple-double, 50+ pkt, milowe statystyki",
  "Wielki powrót — odrobiony deficyt",
  "Dogrywka i festiwal ofensywy",
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
    <div className="min-h-screen flex flex-col">
      {/* ---- TOPBAR (sticky) ---- */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="w-[92%] max-w-[1600px] mx-auto h-16 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid place-items-center h-9 w-9 bg-accent text-bg font-display font-black text-lg rounded-sm">
              N
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight hidden sm:block">
              NBA<span className="text-accent">WATCH</span>
            </span>
          </a>
          <DateNav date={date} />
        </div>
      </header>

      {/* ---- CONTENT ---- */}
      <main className="w-[92%] max-w-[1600px] mx-auto flex-1 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
        {/* lewa kolumna: lista meczów */}
        <section className="min-w-0">
          <div className="flex items-baseline justify-between mb-3">
            <h1 className="font-display text-xl font-extrabold capitalize">
              {formatPl(date)}
            </h1>
            {!error && previews.length > 0 && (
              <span className="text-sm text-muted font-mono">
                {previews.length} meczów
              </span>
            )}
          </div>

          {/* pasek statystyk dnia */}
          {!error && previews.length > 0 && (
            <DayStats previews={previews} />
          )}

          {error ? (
            <EmptyState
              title="Nie udało się pobrać meczów"
              desc="Problem z połączeniem ze źródłem danych. Odśwież stronę."
            />
          ) : previews.length === 0 ? (
            <EmptyState
              title="Brak zakończonych meczów"
              desc="Wybierz inną datę strzałkami lub klikając w datę powyżej."
            />
          ) : (
            <ul className="flex flex-col gap-px bg-border border border-border rounded-md overflow-hidden">
              {previews.map((p, i) => (
                <li
                  key={p.id}
                  className="animate-fade"
                  style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
                >
                  <GameCard preview={p} rank={i + 1} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* prawa kolumna: sidebar informacyjny */}
        <aside className="lg:sticky lg:top-[5.5rem] flex flex-col gap-4">
          {/* czym jest */}
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-display font-bold text-sm uppercase tracking-wide">
                Wskaźnik oglądalności
              </h2>
            </div>
            <p className="px-4 py-3 text-[13px] leading-relaxed text-muted">
              Liczba <span className="text-text font-semibold">0–100</span> mówi
              jak emocjonujący był mecz — <span className="text-accent">bez
              zdradzania kto wygrał</span>. Kliknij mecz, by odkryć wynik, box
              score i rozkład punktów.
            </p>
          </div>

          {/* poziomy */}
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-display font-bold text-sm uppercase tracking-wide">
                Poziomy
              </h2>
            </div>
            <ul>
              {TIERS.map((t) => (
                <li
                  key={t.label}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: t.color }}
                  />
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="ml-auto font-mono text-xs text-faint tabular-nums">
                    {t.range}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* co składa się na wynik */}
          <div className="border border-border rounded-md bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-display font-bold text-sm uppercase tracking-wide">
                Co liczy wskaźnik
              </h2>
            </div>
            <ul className="px-4 py-3 space-y-2">
              {FACTORS.map((f) => {
                const [head, ...rest] = f.split(" — ");
                return (
                  <li key={head} className="flex gap-2.5 text-[13px] leading-snug">
                    <span className="text-accent mt-0.5 shrink-0">▸</span>
                    <span>
                      <span className="font-semibold">{head}</span>
                      {rest.length > 0 && (
                        <span className="text-muted"> — {rest.join(" — ")}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </main>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-border">
        <div className="w-[92%] max-w-[1600px] mx-auto py-4 flex items-center justify-between text-xs text-faint">
          <span>NBA Watch · wskaźnik autorski</span>
          <span>Dane: ESPN</span>
        </div>
      </footer>
    </div>
  );
}

function DayStats({ previews }: { previews: GamePreview[] }) {
  const scores = previews.map((p) => p.watchScore);
  const top = Math.max(...scores);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const mustWatch = previews.filter((p) => p.watchScore >= 85).length;
  const worth = previews.filter((p) => p.watchScore >= 55).length;

  const stats = [
    { label: "Najlepszy", value: top },
    { label: "Średnia", value: avg },
    { label: "Obowiązkowo", value: mustWatch },
    { label: "Warto+", value: worth },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-md overflow-hidden mb-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface px-3 py-2.5 text-center">
          <div className="font-display text-2xl font-black tabular-nums text-accent leading-none">
            {s.value}
          </div>
          <div className="text-[11px] text-faint uppercase tracking-wide mt-1">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-border rounded-md bg-surface py-16 px-6 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="mt-1.5 text-sm text-muted max-w-sm mx-auto">{desc}</p>
    </div>
  );
}
