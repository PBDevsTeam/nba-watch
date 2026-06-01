import type { WatchContext, WatchFactor } from "@/lib/types";

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded-sm bg-surface-hover overflow-hidden">
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
  const showContext = context.kind !== "regular";

  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border bg-surface-hover">
        <h4 className="font-display font-bold text-sm uppercase tracking-wide">
          Jak policzono wskaźnik
        </h4>
      </div>

      <div className="p-3 space-y-4">
        {/* główny powód */}
        {primary && (
          <div className="border-l-2 border-accent pl-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-accent mb-1">
              Główny powód, aby obejrzeć
            </div>
            <div className="flex items-end justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="font-display text-base font-bold">
                  {primary.label}
                </div>
                <div className="text-[13px] text-muted truncate">
                  {primary.detail}
                </div>
              </div>
              <div className="font-mono text-2xl font-black text-accent tabular-nums shrink-0 leading-none">
                {primary.standalone}
              </div>
            </div>
            <Bar value={primary.standalone} />
          </div>
        )}

        {/* pozostałe powody */}
        {supporting.length > 0 && (
          <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-2.5">
            {supporting.map((f) => (
              <li key={f.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="font-medium">{f.label}</span>
                  <span className="font-mono tabular-nums text-muted">
                    {f.standalone}
                  </span>
                </div>
                <Bar value={f.standalone} />
                <p className="text-[11px] text-faint truncate">{f.detail}</p>
              </li>
            ))}
          </ul>
        )}

        {/* podsumowanie */}
        <div className="border-t border-border pt-3 space-y-1 text-[13px]">
          <div className="flex items-center justify-between text-muted">
            <span>Wynik bazowy (szczyt + wsparcie)</span>
            <span className="font-mono tabular-nums">{base}</span>
          </div>
          {showContext && (
            <div className="flex items-center justify-between text-accent">
              <span>Mnożnik · {context.label}</span>
              <span className="font-mono tabular-nums">
                ×{context.multiplier.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between font-display font-bold text-sm pt-1">
            <span>Wskaźnik końcowy</span>
            <span className="font-mono tabular-nums text-accent">{score}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
