import type { WatchFactor } from "@/lib/types";

export function BreakdownList({ breakdown }: { breakdown: WatchFactor[] }) {
  return (
    <div className="space-y-2.5">
      <h4 className="font-display text-sm font-semibold text-muted uppercase tracking-wider">
        Jak policzono wskaźnik
      </h4>
      <ul className="space-y-2">
        {breakdown.map((f) => {
          const pct = f.max > 0 ? (f.points / f.max) * 100 : 0;
          const active = f.points > 0;
          return (
            <li key={f.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={active ? "text-text" : "text-faint"}>
                  {f.label}
                </span>
                <span
                  className={`font-mono tabular-nums ${
                    active ? "text-accent-soft" : "text-faint"
                  }`}
                >
                  +{f.points}
                  <span className="text-faint">/{f.max}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-faint">{f.detail}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
