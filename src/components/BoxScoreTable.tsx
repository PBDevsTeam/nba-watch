import type { TeamBox } from "@/lib/types";

function TeamTable({ box, won }: { box: TeamBox; won: boolean }) {
  const players = [...box.players].sort(
    (a, b) => b.min - a.min || b.pts - a.pts
  );
  const topPts = players.reduce((m, p) => Math.max(m, p.pts), 0);

  return (
    <div className="glass-soft rounded-2xl overflow-hidden min-w-0">
      {/* nagłówek drużyny */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
        {box.team.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={box.team.logo} alt="" className="h-7 w-7" />
        )}
        <div className="min-w-0">
          <div className="font-display font-bold leading-tight truncate flex items-center gap-2">
            {box.team.shortName}
            {won && (
              <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent-soft">
                W
              </span>
            )}
          </div>
          <div className="text-xs text-faint">{box.team.name}</div>
        </div>
        <span className="font-display text-2xl font-extrabold ml-auto tabular-nums">
          {box.score}
        </span>
      </div>

      {/* tabela */}
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full text-[13px] min-w-[34rem]">
          <thead>
            <tr className="text-faint text-left text-[11px] uppercase tracking-wider">
              <th className="font-medium py-2 pl-4 pr-2">Zawodnik</th>
              <th className="font-medium py-2 px-2 text-right">MIN</th>
              <th className="font-medium py-2 px-2 text-right">PKT</th>
              <th className="font-medium py-2 px-2 text-right">ZB</th>
              <th className="font-medium py-2 px-2 text-right">AS</th>
              <th className="font-medium py-2 px-2 text-right">PRZ</th>
              <th className="font-medium py-2 px-2 text-right">BLK</th>
              <th className="font-medium py-2 px-2 text-right">FG</th>
              <th className="font-medium py-2 pl-2 pr-4 text-right">3PT</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {players.map((p) => {
              const isTop = p.pts === topPts && topPts > 0;
              return (
                <tr
                  key={p.name}
                  className="border-t border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                >
                  <td className="py-2 pl-4 pr-2 font-sans truncate max-w-[11rem]">
                    <span className={isTop ? "text-accent-soft font-semibold" : ""}>
                      {p.name}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right text-faint">{p.min}</td>
                  <td
                    className={`py-2 px-2 text-right font-semibold ${
                      isTop ? "text-accent-soft" : "text-text"
                    }`}
                  >
                    {p.pts}
                  </td>
                  <td className="py-2 px-2 text-right text-muted">{p.reb}</td>
                  <td className="py-2 px-2 text-right text-muted">{p.ast}</td>
                  <td className="py-2 px-2 text-right text-faint">{p.stl}</td>
                  <td className="py-2 px-2 text-right text-faint">{p.blk}</td>
                  <td className="py-2 px-2 text-right text-faint">{p.fg}</td>
                  <td className="py-2 pl-2 pr-4 text-right text-faint">{p.tp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BoxScoreTable({
  away,
  home,
}: {
  away: TeamBox;
  home: TeamBox;
}) {
  const awayWon = away.score > home.score;
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <TeamTable box={away} won={awayWon} />
      <TeamTable box={home} won={!awayWon} />
    </div>
  );
}
