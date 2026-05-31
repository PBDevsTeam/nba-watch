// Silnik wskaźnika "Watchability Score" (Tier A — wyłącznie z box score).
// Wynik 0-100 NIE zdradza kto wygrał — mówi tylko JAK dobry był mecz.

import type { GameSummary } from "./espn";
import type { WatchFactor, WatchTier } from "./types";

const TIERS: WatchTier[] = [
  { key: "must", label: "Obowiązkowo", emoji: "🔥", color: "#ff3b30" },
  { key: "great", label: "Bardzo warto", emoji: "🟢", color: "#34c759" },
  { key: "good", label: "Warto", emoji: "🟡", color: "#ffcc00" },
  { key: "average", label: "Przeciętny", emoji: "🟠", color: "#ff9500" },
  { key: "skip", label: "Można odpuścić", emoji: "⚪", color: "#8a8a8f" },
];

export function tierForScore(score: number): WatchTier {
  if (score >= 85) return TIERS[0];
  if (score >= 70) return TIERS[1];
  if (score >= 55) return TIERS[2];
  if (score >= 40) return TIERS[3];
  return TIERS[4];
}

// --- pojedyncze składowe ---------------------------------------------------

function closenessFactor(margin: number): WatchFactor {
  let points = 0;
  if (margin <= 3) points = 35;
  else if (margin <= 6) points = 28;
  else if (margin <= 9) points = 20;
  else if (margin <= 12) points = 12;
  else if (margin <= 15) points = 7;
  else if (margin <= 20) points = 3;
  return {
    key: "closeness",
    label: "Końcówka na styku",
    detail: `Różnica ${margin} pkt`,
    points,
    max: 35,
  };
}

function overtimeFactor(periods: number): WatchFactor {
  const ot = Math.max(0, periods - 4);
  let points = 0;
  if (ot === 1) points = 18;
  else if (ot >= 2) points = 25;
  return {
    key: "overtime",
    label: "Dogrywka",
    detail: ot === 0 ? "Brak" : `${ot}× OT`,
    points,
    max: 25,
  };
}

function starFactor(topScorer: { name: string; pts: number }): WatchFactor {
  const p = topScorer.pts;
  let points = 0;
  if (p >= 60) points = 25;
  else if (p >= 50) points = 22;
  else if (p >= 40) points = 14;
  else if (p >= 30) points = 6;
  return {
    key: "star",
    label: "Gwiazdorski występ",
    detail: p >= 30 ? `${topScorer.name} — ${p} pkt` : `Najwięcej: ${p} pkt`,
    points,
    max: 25,
  };
}

function featsFactor(opts: {
  tripleDoubles: number;
  bigReb: number; // gracze z 20+ zb
  bigAst: number; // gracze z 15+ as
  defStuffs: number; // gracze z 5+ blok lub 5+ przechwyt
}): WatchFactor {
  let points = 0;
  const bits: string[] = [];
  if (opts.tripleDoubles > 0) {
    points += Math.min(2, opts.tripleDoubles) * 12;
    bits.push(`${opts.tripleDoubles}× triple-double`);
  }
  if (opts.bigReb > 0) {
    points += 5;
    bits.push("20+ zbiórek");
  }
  if (opts.bigAst > 0) {
    points += 5;
    bits.push("15+ asyst");
  }
  if (opts.defStuffs > 0) {
    points += 3;
    bits.push("5+ bloków/przechwytów");
  }
  points = Math.min(points, 20);
  return {
    key: "feats",
    label: "Wyczyny statystyczne",
    detail: bits.length ? bits.join(", ") : "Brak wyróżniających się",
    points,
    max: 20,
  };
}

function shootoutFactor(combined: number): WatchFactor {
  let points = 0;
  if (combined >= 250) points = 15;
  else if (combined >= 240) points = 11;
  else if (combined >= 230) points = 8;
  else if (combined >= 220) points = 5;
  else if (combined >= 210) points = 2;
  return {
    key: "shootout",
    label: "Strzelanina",
    detail: `${combined} pkt łącznie`,
    points,
    max: 15,
  };
}

// --- główna funkcja --------------------------------------------------------

export type Watchability = {
  score: number;
  tier: WatchTier;
  breakdown: WatchFactor[];
};

export function computeWatchability(game: GameSummary): Watchability {
  const allPlayers = [...game.home.players, ...game.away.players];

  const margin = Math.abs(game.home.score - game.away.score);
  const combined = game.home.score + game.away.score;

  const topScorer = allPlayers.reduce(
    (best, p) => (p.pts > best.pts ? { name: p.name, pts: p.pts } : best),
    { name: "—", pts: 0 }
  );

  const tripleDoubles = allPlayers.filter((p) => p.doubleDigitCats >= 3).length;
  const bigReb = allPlayers.filter((p) => p.reb >= 20).length;
  const bigAst = allPlayers.filter((p) => p.ast >= 15).length;
  const defStuffs = allPlayers.filter((p) => p.blk >= 5 || p.stl >= 5).length;

  const breakdown: WatchFactor[] = [
    closenessFactor(margin),
    overtimeFactor(game.periods),
    starFactor(topScorer),
    featsFactor({ tripleDoubles, bigReb, bigAst, defStuffs }),
    shootoutFactor(combined),
  ];

  const raw = breakdown.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  return { score, tier: tierForScore(score), breakdown };
}
