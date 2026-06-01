import type { TeamBox } from "@/lib/types";

function TeamTable({ box, won }: { box: TeamBox; won: boolean }) {
  const players = [...box.players].sort(
    (a, b) => b.min - a.min || b.pts - a.pts
  );
  const topPts = players.reduce((m, p) => Math.max(m, p.pts), 0);

  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden min-w-0">
      {/* nagłówek drużyny */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border bg-surface-hover">
        {box.team.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={box.team.logo} alt="" className="h-6 w-6" />
        )}
        <span className="font-display font-bold text-sm">{box.team.shortName}</span>
        {won && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-accent text-bg">
            W
          </span>
        )}
        <span className="font-display text-xl font-black ml-auto tabular-nums">
          {box.score}
        </span>
      </div>

      {/* tabela — kluczowe kolumny, mieszczą się bez poziomego scrolla */}
      <table className="w-full text-[13px] table-fixed">
        <thead>
          <tr className="text-faint text-left text-[10px] uppercase tracking-wider bg-surface-2">
            <th className="font-semibold py-1.5 pl-3 pr-2 w-auto">Zawodnik</th>
            <th className="font-semibold py-1.5 px-1 text-right w-10">MIN</th>
            <th className="font-semibold py-1.5 px-1 text-right w-10">PKT</th>
            <th className="font-semibold py-1.5 px-1 text-right w-9">ZB</th>
            <th className="font-semibold py-1.5 px-1 text-right w-9">AS</th>
            <th className="font-semibold py-1.5 px-1 text-right w-9">PRZ</th>
            <th className="font-semibold py-1.5 pl-1 pr-3 text-right w-9">BLK</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {players.map((p) => {
            const isTop = p.pts === topPts && topPts > 0;
            return (
              <tr
                key={p.name}
                className="border-t border-border/60 hover:bg-surface-hover transition-colors"
              >
                <td className="py-1.5 pl-3 pr-2 font-sans truncate">
                  <span className={isTop ? "text-accent font-semibold" : ""}>
                    {p.name}
                  </span>
                </td>
                <td className="py-1.5 px-1 text-right text-faint">{p.min}</td>
                <td
                  className={`py-1.5 px-1 text-right font-bold ${
                    isTop ? "text-accent" : "text-text"
                  }`}
                >
                  {p.pts}
                </td>
                <td className="py-1.5 px-1 text-right text-muted">{p.reb}</td>
                <td className="py-1.5 px-1 text-right text-muted">{p.ast}</td>
                <td className="py-1.5 px-1 text-right text-faint">{p.stl}</td>
                <td className="py-1.5 pl-1 pr-3 text-right text-faint">{p.blk}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
    <div className="grid lg:grid-cols-2 gap-3">
      <TeamTable box={away} won={awayWon} />
      <TeamTable box={home} won={!awayWon} />
    </div>
  );
}
