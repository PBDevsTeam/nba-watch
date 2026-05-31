import type { WatchFactor } from "@/lib/types";

export function BreakdownList({ breakdown }: { breakdown: WatchFactor[] }) {
  return (
    <div className="glass-soft rounded-2xl p-5">
      <h4 className="font-display text-sm font-bold text-muted uppercase tracking-[0.15em] mb-4">
        Jak policzono wskaźnik
      </h4>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        {breakdown.map((f) => {
          const pct = f.max > 0 ? (f.points / f.max) * 100 : 0;
          const active = f.points > 0;
          return (
            <li key={f.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span
                  className={`font-medium ${active ? "text-text" : "text-faint"}`}
                >
                  {f.label}
                </span>
                <span
                  className={`font-mono tabular-nums text-sm ${
                    active ? "text-accent-soft" : "text-faint"
                  }`}
                >
                  +{f.points}
                  <span className="text-faint">/{f.max}</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: active
                      ? "linear-gradient(90deg, var(--color-accent), var(--color-accent-soft))"
                      : "transparent",
                  }}
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
