import type { WatchContext, WatchFactor } from "@/lib/types";

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-sm bg-surface-hover overflow-hidden">
      <div
        className="h-full bg-accent transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
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

  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-hover">
        <h4 className="font-display font-bold text-base uppercase tracking-wide">
          Jak policzono wskaźnik
        </h4>
      </div>

      <div className="p-4 space-y-5">
        {/* główny powód */}
        {primary && (
          <div className="border-l-[3px] border-accent pl-4">
            <div className="text-xs font-mono uppercase tracking-wider text-accent mb-1.5">
              Główny powód, aby obejrzeć
            </div>
            <div className="flex items-center justify-between gap-4 mb-2.5">
              <div className="min-w-0">
                <div className="font-display text-xl font-bold leading-tight">
                  {primary.label}
                </div>
                <div className="text-sm text-muted mt-0.5">{primary.detail}</div>
              </div>
              <div className="font-mono text-3xl font-black text-accent tabular-nums shrink-0 leading-none">
                {primary.standalone}
              </div>
            </div>
            <Bar value={primary.standalone} />
          </div>
        )}

        {/* pozostałe powody */}
        {supporting.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-faint">
              Pozostałe powody
            </div>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {supporting.map((f) => (
                <li key={f.key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-[15px]">{f.label}</span>
                    <span className="font-mono tabular-nums text-base text-muted">
                      {f.standalone}
                    </span>
                  </div>
                  <Bar value={f.standalone} />
                  <p className="text-sm text-faint">{f.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* podsumowanie — kontekst ZAWSZE widoczny */}
        <div className="border-t border-border pt-4 space-y-2 text-[15px]">
          <div className="flex items-center justify-between text-muted">
            <span>Wynik bazowy (szczyt + wsparcie)</span>
            <span className="font-mono tabular-nums">{base}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-muted">Mnożnik za rangę meczu</span>
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                  context.kind === "regular"
                    ? "bg-surface-hover text-faint"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {context.label}
              </span>
            </span>
            <span
              className={`font-mono tabular-nums ${
                context.kind === "regular" ? "text-muted" : "text-accent"
              }`}
            >
              ×{context.multiplier.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between font-display font-bold text-lg pt-1.5 border-t border-border/60">
            <span>Wskaźnik końcowy</span>
            <span className="font-mono tabular-nums text-accent">{score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
