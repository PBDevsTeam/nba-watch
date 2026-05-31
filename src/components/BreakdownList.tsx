import type { WatchContext, WatchFactor } from "@/lib/types";

function Bar({ value, strong }: { value: number; strong?: boolean }) {
  return (
    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background:
            value > 0
              ? strong
                ? "linear-gradient(90deg, var(--color-accent), #ffd28a)"
                : "linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))"
              : "transparent",
        }}
      />
    </div>
  );
}

export function BreakdownList({
  breakdown,
  context,
  base,
  score,
}: {
  breakdown: WatchFactor[];
  context: WatchContext;
  base: number;
  score: number;
}) {
  const primary = breakdown.find((f) => f.primary) ?? breakdown[0];
  const supporting = breakdown.filter((f) => f !== primary && f.standalone > 0);
  const showContext = context.kind !== "regular";

  return (
    <div className="glass-soft rounded-2xl p-5 space-y-5">
      <h4 className="font-display text-sm font-bold text-muted uppercase tracking-[0.15em]">
        Jak policzono wskaźnik
      </h4>

      {/* główny powód */}
      {primary && (
        <div className="rounded-xl border border-accent/30 bg-accent/[0.07] p-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-accent-soft mb-2">
            <span>▶</span> Główny powód, aby obejrzeć
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg font-bold">{primary.label}</div>
              <div className="text-sm text-muted truncate">{primary.detail}</div>
            </div>
            <div className="font-mono text-2xl font-extrabold text-accent-soft tabular-nums shrink-0">
              {primary.standalone}
            </div>
          </div>
          <div className="mt-3">
            <Bar value={primary.standalone} strong />
          </div>
        </div>
      )}

      {/* wspierające powody */}
      {supporting.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-faint">
            Pozostałe powody
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {supporting.map((f) => (
              <li key={f.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-text">{f.label}</span>
                  <span className="font-mono tabular-nums text-accent-soft">
                    {f.standalone}
                  </span>
                </div>
                <Bar value={f.standalone} />
                <p className="text-xs text-faint">{f.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* podsumowanie obliczenia */}
      <div className="border-t border-white/10 pt-4 space-y-1.5 text-sm">
        <div className="flex items-center justify-between text-muted">
          <span>Wynik bazowy (szczyt + wsparcie)</span>
          <span className="font-mono tabular-nums">{base}</span>
        </div>
        {showContext && (
          <div className="flex items-center justify-between text-accent-soft">
            <span>Mnożnik kontekstu · {context.label}</span>
            <span className="font-mono tabular-nums">×{context.multiplier.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between font-display font-bold text-base pt-1">
          <span>Wskaźnik końcowy</span>
          <span className="font-mono tabular-nums text-accent-soft">{score}</span>
        </div>
      </div>
    </div>
  );
}
