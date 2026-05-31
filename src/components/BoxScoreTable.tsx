import type { TeamBox } from "@/lib/types";

function TeamTable({ box }: { box: TeamBox }) {
  // top 6 graczy wg minut/punktów dla zwięzłości
  const players = [...box.players]
    .sort((a, b) => b.min - a.min || b.pts - a.pts)
    .slice(0, 8);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-2">
        {box.team.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={box.team.logo} alt="" className="h-5 w-5" />
        )}
        <span className="font-display font-semibold text-sm truncate">
          {box.team.shortName}
        </span>
        <span className="font-mono text-faint text-xs ml-auto">
          {box.score} pkt
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-faint text-left">
              <th className="font-normal py-1 pr-2">Zawodnik</th>
              <th className="font-normal py-1 px-1 text-right">PKT</th>
              <th className="font-normal py-1 px-1 text-right">ZB</th>
              <th className="font-normal py-1 px-1 text-right">AS</th>
              <th className="font-normal py-1 pl-1 text-right">MIN</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {players.map((p) => (
              <tr key={p.name} className="border-t border-border/60">
                <td className="py-1 pr-2 font-sans truncate max-w-[8rem]">
                  {p.name}
                </td>
                <td className="py-1 px-1 text-right text-text">{p.pts}</td>
                <td className="py-1 px-1 text-right text-muted">{p.reb}</td>
                <td className="py-1 px-1 text-right text-muted">{p.ast}</td>
                <td className="py-1 pl-1 text-right text-faint">{p.min}</td>
              </tr>
            ))}
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
  return (
    <div className="grid sm:grid-cols-2 gap-5">
      <TeamTable box={away} />
      <TeamTable box={home} />
    </div>
  );
}
