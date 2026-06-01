import type { FlowPoint, TeamInfo } from "@/lib/types";

/** Kolor drużyny z ESPN (hex bez #) lub fallback. */
function col(c: string | null, fb: string) {
  if (!c) return fb;
  return c.startsWith("#") ? c : `#${c}`;
}

/**
 * Wykres przebiegu różnicy punktowej (home - away) w czasie meczu.
 * Pole nad osią = prowadzi gospodarz, pole pod osią = prowadzi gość.
 * Obrazuje comebacki i zmiany prowadzenia. Renderowany TYLKO po revealu.
 */
export function ScoreFlow({
  flow,
  home,
  away,
  periods,
}: {
  flow: FlowPoint[];
  home: TeamInfo;
  away: TeamInfo;
  periods: number;
}) {
  if (flow.length < 2) return null;

  const W = 1000;
  const H = 200;
  const padY = 16;
  const maxAbs = Math.max(8, ...flow.map((p) => Math.abs(p.diff)));
  const homeCol = col(home.color, "#ff6b2c");
  const awayCol = col(away.color, "#6f8bff");

  const x = (t: number) => t * W;
  const y = (diff: number) => H / 2 - (diff / maxAbs) * (H / 2 - padY);

  // ścieżka linii
  const line = flow
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.diff).toFixed(1)}`)
    .join(" ");
  // wypełnienie do osi zera
  const area = `${line} L ${x(flow[flow.length - 1].t).toFixed(1)} ${H / 2} L ${x(flow[0].t).toFixed(1)} ${H / 2} Z`;

  // pionowe linie kwart
  const totalPeriods = Math.max(4, periods);
  const quarterLines = Array.from({ length: totalPeriods - 1 }, (_, i) => (i + 1) / totalPeriods);

  const maxLead = Math.max(...flow.map((p) => p.diff)); // dodatnie = home
  const minLead = Math.min(...flow.map((p) => p.diff)); // ujemne = away

  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover">
        <h4 className="font-display font-bold text-base uppercase tracking-wide">
          Przebieg meczu
        </h4>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: homeCol }} />
            {home.abbreviation}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: awayCol }} />
            {away.abbreviation}
          </span>
        </div>
      </div>

      <div className="p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`flow-${home.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={homeCol} stopOpacity="0.35" />
              <stop offset="50%" stopColor={homeCol} stopOpacity="0.02" />
              <stop offset="50%" stopColor={awayCol} stopOpacity="0.02" />
              <stop offset="100%" stopColor={awayCol} stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* linie kwart */}
          {quarterLines.map((t, i) => (
            <line
              key={i}
              x1={x(t)}
              y1={0}
              x2={x(t)}
              y2={H}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}
          {/* oś zero */}
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="var(--color-border-strong)" strokeWidth="1.5" />

          {/* wypełnienie + linia */}
          <path d={area} fill={`url(#flow-${home.id})`} />
          <path d={line} fill="none" stroke="#f4f6fb" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>

        {/* podpisy: max prowadzenia każdej drużyny */}
        <div className="flex items-center justify-between mt-2 px-1 text-xs text-faint">
          <span>
            {maxLead > 0 && (
              <>
                <span style={{ color: homeCol }} className="font-semibold">
                  {home.abbreviation}
                </span>{" "}
                prowadził max {maxLead}
              </>
            )}
          </span>
          <span>
            {minLead < 0 && (
              <>
                <span style={{ color: awayCol }} className="font-semibold">
                  {away.abbreviation}
                </span>{" "}
                prowadził max {Math.abs(minLead)}
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
