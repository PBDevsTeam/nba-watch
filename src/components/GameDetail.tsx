"use client";

// Wszystko, co pokazujemy PO odkryciu wyniku: wynik i kwarty, przebieg meczu,
// uzasadnienie oceny i box score.

import { useState } from "react";
import type { FlowPoint, GameReveal, TeamBox, TeamInfo, WatchFactor } from "@/lib/types";
import { chartColors } from "@/lib/logo";
import { TeamLogo, tierVar } from "./ui";

function periodName(i: number): string {
  return i < 4 ? `${i + 1}` : i === 4 ? "D" : `D${i - 3}`;
}

function ResultHeader({ data }: { data: GameReveal }) {
  const { away, home } = data;
  const awayWon = away.score > home.score;
  const ot = Math.max(0, data.periods - 4);
  const side = (b: TeamBox, won: boolean, align: "left" | "right") => (
    <div className={`flex items-center gap-3 min-w-0 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamLogo team={b.team} size={40} />
      <div className="min-w-0">
        <div className={`font-display text-2xl font-extrabold leading-none ${won ? "text-text" : "text-muted"}`}>
          {b.team.abbreviation}
        </div>
        <div className="hidden sm:block text-sm text-faint truncate mt-1">{b.team.shortName}</div>
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
      {side(away, awayWon, "left")}
      <div className="text-center">
        <div className="font-display font-black tabular-nums leading-none text-[44px] sm:text-[56px] whitespace-nowrap">
          <span className={awayWon ? "text-text" : "text-faint"}>{away.score}</span>
          <span className="text-faint mx-2 sm:mx-3 font-bold">:</span>
          <span className={!awayWon ? "text-text" : "text-faint"}>{home.score}</span>
        </div>
        <div className="text-xs text-faint mt-1.5">
          {ot === 0 ? "Koniec meczu" : ot === 1 ? "Po dogrywce" : `Po ${ot} dogrywkach`}
        </div>
      </div>
      {side(home, !awayWon, "right")}
    </div>
  );
}

function LineScore({ data }: { data: GameReveal }) {
  const rows = [data.away, data.home];
  const n = Math.max(data.away.linescore.length, data.home.linescore.length);
  if (n === 0) return null;
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-faint">
            <th className="text-left font-medium py-1.5 pr-3">Kwarta</th>
            {Array.from({ length: n }, (_, i) => (
              <th key={i} className="font-medium py-1.5 px-2 text-right w-10">
                {periodName(i)}
              </th>
            ))}
            <th className="font-medium py-1.5 pl-3 text-right w-12">Razem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.homeAway} className="border-t border-line">
              <td className="py-2 pr-3 font-semibold">{r.team.abbreviation}</td>
              {Array.from({ length: n }, (_, i) => (
                <td key={i} className="py-2 px-2 text-right text-muted">
                  {r.linescore[i] ?? "–"}
                </td>
              ))}
              <td className="py-2 pl-3 text-right font-bold">{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Przebieg różnicy punktowej. Nad osią prowadzi gospodarz, pod osią gość.
 * Oś czasu jest proporcjonalna: kwarta 12 min, dogrywka 5 min.
 */
function ScoreFlow({
  flow,
  home,
  away,
  periods,
  id,
}: {
  flow: FlowPoint[];
  home: TeamInfo;
  away: TeamInfo;
  periods: number;
  id: string;
}) {
  if (flow.length < 2) return null;
  const W = 1000;
  const H = 240;
  const pad = 14;
  const mid = H / 2;
  const maxAbs = Math.max(8, ...flow.map((p) => Math.abs(p.diff)));
  const [homeCol, awayCol] = chartColors(home.color, away.color);
  const x = (t: number) => t * W;
  const y = (d: number) => mid - (d / maxAbs) * (mid - pad);

  const line = flow
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.diff).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(flow[flow.length - 1].t).toFixed(1)},${mid} L${x(flow[0].t).toFixed(1)},${mid} Z`;

  const total = Math.max(4, periods);
  const totalSec = 4 * 720 + (total - 4) * 300;
  const bounds = Array.from({ length: total - 1 }, (_, i) => {
    const p = i + 2; // początek kwarty p
    const start = p <= 4 ? (p - 1) * 720 : 4 * 720 + (p - 5) * 300;
    return start / totalSec;
  });
  const labels = Array.from({ length: total }, (_, i) => {
    const s = i < 4 ? i * 720 : 4 * 720 + (i - 4) * 300;
    const e = i < 4 ? (i + 1) * 720 : 4 * 720 + (i - 3) * 300;
    return { name: i < 4 ? `${i + 1}. kw.` : i === 4 ? "Dogr." : `D${i - 3}`, mid: (s + e) / 2 / totalSec };
  });

  const maxHome = Math.max(0, ...flow.map((p) => p.diff));
  const maxAway = Math.max(0, ...flow.map((p) => -p.diff));
  const clipTop = `flow-top-${id}`;
  const clipBottom = `flow-bottom-${id}`;

  return (
    <figure className="rounded-[var(--radius-panel)] bg-bg/60 border border-line p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <span className="font-display text-lg font-extrabold">Przebieg meczu</span>
        <span className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: homeCol }} />
            {home.abbreviation} <span className="text-faint">max +{maxHome}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: awayCol }} />
            {away.abbreviation} <span className="text-faint">max +{maxAway}</span>
          </span>
        </span>
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-[150px] sm:h-[190px] block"
          role="img"
          aria-label={`Przebieg różnicy punktów. Największe prowadzenie: ${home.abbreviation} ${maxHome}, ${away.abbreviation} ${maxAway}.`}
        >
          <defs>
            <clipPath id={clipTop}>
              <rect x="0" y="0" width={W} height={mid} />
            </clipPath>
            <clipPath id={clipBottom}>
              <rect x="0" y={mid} width={W} height={mid} />
            </clipPath>
          </defs>
          {bounds.map((t, i) => (
            <line key={i} x1={x(t)} x2={x(t)} y1={0} y2={H} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={0} x2={W} y1={mid} y2={mid} stroke="var(--line-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill={homeCol} fillOpacity="0.28" clipPath={`url(#${clipTop})`} />
          <path d={area} fill={awayCol} fillOpacity="0.28" clipPath={`url(#${clipBottom})`} />
          <path d={line} fill="none" stroke={homeCol} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" clipPath={`url(#${clipTop})`} />
          <path d={line} fill="none" stroke={awayCol} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" clipPath={`url(#${clipBottom})`} />
        </svg>
        <div className="relative h-5 mt-1 text-[11px] text-faint">
          {labels.map((l) => (
            <span key={l.name} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${l.mid * 100}%` }}>
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

function Breakdown({ data }: { data: GameReveal }) {
  const primary: WatchFactor | undefined = data.breakdown.find((f) => f.primary) ?? data.breakdown[0];
  const rest = data.breakdown.filter((f) => f !== primary && f.standalone > 0);
  const color = tierVar(data.tier.key);
  const ctx = data.context;

  return (
    <section className="rounded-[var(--radius-panel)] bg-bg/60 border border-line p-4">
      <h4 className="font-display text-lg font-extrabold mb-3">Dlaczego {data.watchScore}</h4>
      {primary && (
        <div className="mb-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">{primary.label}</span>
            <span className="font-display text-2xl font-black tabular-nums" style={{ color }}>
              {primary.standalone}
            </span>
          </div>
          <p className="text-sm text-muted mb-2">{primary.detail}</p>
          <Bar value={primary.standalone} color={color} />
        </div>
      )}
      {rest.length > 0 && (
        <ul className="space-y-3">
          {rest.map((f) => (
            <li key={f.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{f.label}</span>
                <span className="tabular-nums text-muted">{f.standalone}</span>
              </div>
              <p className="text-xs text-faint mb-1.5">{f.detail}</p>
              <Bar value={f.standalone} color="var(--muted)" />
            </li>
          ))}
        </ul>
      )}
      <dl className="mt-4 pt-3 border-t border-line text-sm space-y-1.5">
        <div className="flex justify-between text-muted">
          <dt title="70% najmocniejszego powodu i 30% pozostałych">Baza</dt>
          <dd className="tabular-nums">{data.base}</dd>
        </div>
        <div className="flex justify-between text-muted">
          <dt>Ranga: {ctx.label}</dt>
          <dd className="tabular-nums">×{ctx.multiplier.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between font-semibold text-text pt-1">
          <dt>Ocena</dt>
          <dd className="tabular-nums" style={{ color }}>
            {data.watchScore}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function BoxScore({ data }: { data: GameReveal }) {
  const [tab, setTab] = useState<"away" | "home">("away");
  const box = tab === "away" ? data.away : data.home;
  const players = box.players.filter((p) => p.min > 0).sort(
    (a, b) => Number(b.starter) - Number(a.starter) || b.min - a.min
  );
  const topPts = Math.max(0, ...players.map((p) => p.pts));
  const firstBench = players.findIndex((p) => !p.starter);

  return (
    <section className="rounded-[var(--radius-panel)] bg-bg/60 border border-line">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <h4 className="font-display text-lg font-extrabold">Zawodnicy</h4>
        <div role="tablist" aria-label="Drużyna" className="inline-flex p-0.5 rounded-lg bg-surface-2">
          {(["away", "home"] as const).map((k) => {
            const b = k === "away" ? data.away : data.home;
            const active = tab === k;
            return (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setTab(k)}
                className={`h-8 px-3 rounded-md text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                  active ? "bg-surface-hover text-text" : "text-faint hover:text-muted"
                }`}
              >
                <TeamLogo team={b.team} size={18} />
                {b.team.abbreviation}
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-faint text-xs">
              <th className="text-left font-medium py-2 pl-4 pr-2">Zawodnik</th>
              <th className="font-medium px-2 text-right" title="Minuty">MIN</th>
              <th className="font-medium px-2 text-right" title="Punkty">PKT</th>
              <th className="font-medium px-2 text-right" title="Zbiórki">ZB</th>
              <th className="font-medium px-2 text-right" title="Asysty">AS</th>
              <th className="font-medium px-2 text-right hidden sm:table-cell" title="Przechwyty">PRZ</th>
              <th className="font-medium px-2 text-right hidden sm:table-cell" title="Bloki">BL</th>
              <th className="font-medium px-2 text-right hidden md:table-cell" title="Rzuty z gry">Z GRY</th>
              <th className="font-medium px-2 text-right hidden md:table-cell" title="Rzuty za 3">ZA 3</th>
              <th className="font-medium pl-2 pr-4 text-right hidden md:table-cell" title="Rzuty wolne">WOLNE</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr
                key={`${p.name}-${i}`}
                className={`border-t ${i === firstBench && i > 0 ? "border-line-strong" : "border-line"}`}
              >
                <td className="py-2 pl-4 pr-2 max-w-[11rem] truncate">
                  <span className={p.pts === topPts && topPts > 0 ? "font-semibold text-text" : "text-muted"}>
                    {p.name}
                  </span>
                </td>
                <td className="px-2 text-right text-faint">{p.min}</td>
                <td className={`px-2 text-right font-semibold ${p.pts === topPts && topPts > 0 ? "text-text" : ""}`}>{p.pts}</td>
                <td className="px-2 text-right text-muted">{p.reb}</td>
                <td className="px-2 text-right text-muted">{p.ast}</td>
                <td className="px-2 text-right text-faint hidden sm:table-cell">{p.stl}</td>
                <td className="px-2 text-right text-faint hidden sm:table-cell">{p.blk}</td>
                <td className="px-2 text-right text-faint hidden md:table-cell">{p.fg}</td>
                <td className="px-2 text-right text-faint hidden md:table-cell">{p.tp}</td>
                <td className="pl-2 pr-4 text-right text-faint hidden md:table-cell">{p.ft}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-xs text-faint">Pierwsza piątka nad kreską, rezerwowi pod nią.</p>
    </section>
  );
}

export function GameDetail({ data }: { data: GameReveal }) {
  return (
    <div className="space-y-4 animate-reveal">
      <ResultHeader data={data} />
      <LineScore data={data} />
      <div className="grid gap-4 items-start xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ScoreFlow flow={data.flow} home={data.home.team} away={data.away.team} periods={data.periods} id={data.id} />
        <Breakdown data={data} />
      </div>
      <BoxScore data={data} />
    </div>
  );
}
