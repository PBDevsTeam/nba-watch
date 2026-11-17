// Silnik wskaźnika "Watchability Score" — model PEAK + KONTEKST.
//
// Kluczowa różnica vs stary model (suma z capami): oglądalność to FUNKCJA SZCZYTU,
// nie suma. Każdy "powód, aby obejrzeć" liczony jest SAMODZIELNIE (0-100) — ile
// byłby wart, gdyby był jedyną rzeczą w meczu. Następnie:
//   base   = 0.7 * peak + 0.3 * softOr(reszta)      (hybryda 70/30)
//   final  = clamp(base * mnożnik_rangi)             (finały > play-off > sezon zasadniczy)
// Dzięki temu pojedynczy historyczny wyczyn (np. 83 pkt) sam czyni mecz must-watch.
//
// Wynik 0-100 NIE zdradza kto wygrał — mówi tylko JAK dobry był mecz.
//
// Stawka meczu (mecz 7, mecz o odpadnięcie) jest osobnym powodem: patrz kontekst.ts.

import type { GameSummary, PbpPoint } from "./espn";
import type { WatchContext, WatchFactor, WatchTier } from "./types";
import { contextFor, stakesFactor } from "./kontekst";

/**
 * Wersja modelu. Wchodzi do klucza cache ocen (scores.ts): po każdej zmianie
 * krzywych albo wag podbij ją, żeby stare oceny nie mieszały się z nowymi.
 */
export const MODEL_VERSION = "3";

// Kolory poziomów żyją w CSS (--color-t-<key>), nie tutaj: oceny są trzymane
// w cache bez końca, a kolor to sprawa wyglądu.
export const TIERS: WatchTier[] = [
  { key: "must", label: "Obowiązkowo", hint: "Mecz, o którym będzie się mówić", min: 85 },
  { key: "great", label: "Bardzo warto", hint: "Wyraźnie ponad przeciętną", min: 70 },
  { key: "good", label: "Warto", hint: "Jest na co popatrzeć", min: 55 },
  { key: "average", label: "Przeciętny", hint: "Dla kibiców tych drużyn", min: 40 },
  { key: "skip", label: "Można odpuścić", hint: "Wystarczy skrót", min: 0 },
];

export function tierForScore(score: number): WatchTier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

// --- narzędzia matematyczne ------------------------------------------------

/** Gładka krzywa po punktach kontrolnych [x, y] (interpolacja liniowa). */
function curve(x: number, anchors: [number, number][]): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    if (x <= anchors[i][0]) {
      const [x0, y0] = anchors[i - 1];
      const [x1, y1] = anchors[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return anchors[anchors.length - 1][1];
}

/**
 * Probabilistyczne OR: kilka średnich powodów akumuluje się, ale nigdy >100.
 * Zera nie zawyżają wyniku. Używane do "reszty" powodów poza szczytem.
 */
function softOr(values: number[]): number {
  const prod = values.reduce((p, v) => {
    const clamped = Math.max(0, Math.min(100, v)) / 100;
    return p * (1 - clamped);
  }, 1);
  return 100 * (1 - prod);
}

const clamp = (x: number) => Math.max(0, Math.min(100, x));

// --- pojedyncze "powody, aby obejrzeć" (każdy 0-100) -----------------------

function scoringExplosion(top: { name: string; pts: number }): WatchFactor {
  const s = clamp(
    curve(top.pts, [
      [20, 0], [30, 28], [40, 60], [50, 80], [60, 91], [70, 97], [80, 100], [100, 100],
    ])
  );
  return {
    key: "scoring",
    label: "Eksplozja punktowa",
    detail: top.pts >= 30 ? `${top.name} — ${top.pts} pkt` : `Najwięcej: ${top.pts} pkt`,
    standalone: Math.round(s),
  };
}

function historicFeat(opts: {
  topPts: number;
  topName: string;
  tripleDoubles: number;
  bigTd: boolean; // triple-double z 20+ w którejś kategorii
  quadDouble: boolean;
  fiveByFive: boolean;
  maxReb: number;
  maxAst: number;
  fiveByFiveName: string;
}): WatchFactor {
  const candidates: { v: number; d: string }[] = [];

  // rekordowe pułapy punktowe (te same punkty co eksplozja, ale jako "wyczyn"
  // — dzięki temu 80+ zapala DWA powody i winduje wynik w górę)
  if (opts.topPts >= 80) candidates.push({ v: 100, d: `${opts.topName} — ${opts.topPts} PKT (rekordowy wynik)` });
  else if (opts.topPts >= 70) candidates.push({ v: 97, d: `${opts.topName} — ${opts.topPts} pkt` });
  else if (opts.topPts >= 60) candidates.push({ v: 90, d: `${opts.topName} — ${opts.topPts} pkt` });
  else if (opts.topPts >= 50) candidates.push({ v: 80, d: `${opts.topName} — ${opts.topPts} pkt` });
  else if (opts.topPts >= 40) candidates.push({ v: 50, d: `${opts.topName} — ${opts.topPts} pkt` });

  if (opts.quadDouble) candidates.push({ v: 100, d: "Quadruple-double" });
  if (opts.fiveByFive) candidates.push({ v: 90, d: `5×5 — ${opts.fiveByFiveName}` });
  if (opts.tripleDoubles >= 2) candidates.push({ v: 90, d: `${opts.tripleDoubles}× triple-double` });
  else if (opts.bigTd) candidates.push({ v: 86, d: "Potężne triple-double" });
  else if (opts.tripleDoubles === 1) candidates.push({ v: 76, d: "Triple-double" });
  if (opts.maxAst >= 20) candidates.push({ v: 88, d: `${opts.maxAst} asyst` });
  else if (opts.maxAst >= 15) candidates.push({ v: 58, d: `${opts.maxAst} asyst` });
  if (opts.maxReb >= 25) candidates.push({ v: 86, d: `${opts.maxReb} zbiórek` });
  else if (opts.maxReb >= 20) candidates.push({ v: 56, d: `${opts.maxReb} zbiórek` });

  const best = candidates.sort((a, b) => b.v - a.v)[0];
  return {
    key: "feat",
    label: "Wyczyn / rekord",
    detail: best ? best.d : "Brak wyróżniającego się wyczynu",
    standalone: best ? best.v : 0,
  };
}

function overtimeFactor(periods: number): WatchFactor {
  const ot = Math.max(0, periods - 4);
  const s = ot === 0 ? 0 : curve(ot, [[1, 82], [2, 93], [3, 100]]);
  return {
    key: "overtime",
    label: "Dogrywka",
    detail: ot === 0 ? "Brak" : ot === 1 ? "Dogrywka" : `${ot}× dogrywka`,
    standalone: Math.round(s),
  };
}

/** Dramat końcówki z play-by-play: jak blisko było w ostatnich 2 min + zmiany prowadzenia. */
function clutchFactor(pbp: PbpPoint[], finalMargin: number, periods: number): WatchFactor {
  // fallback gdy brak PBP — użyj samej różnicy końcowej (osłabione)
  if (!pbp.length) {
    const s = clamp(curve(finalMargin, [[0, 80], [3, 70], [6, 55], [10, 35], [15, 12], [20, 0]]));
    return {
      key: "clutch",
      label: "Wyrównana końcówka",
      detail: `Różnica ${finalMargin} pkt`,
      standalone: Math.round(s),
    };
  }

  const finalPeriod = Math.max(4, periods);

  // 1) najmniejsza różnica w ostatnich 120 s ostatniej kwarty/OT
  let minLate = Infinity;
  for (const p of pbp) {
    if (p.period >= finalPeriod && p.sec !== null && p.sec <= 120) {
      minLate = Math.min(minLate, Math.abs(p.home - p.away));
    }
  }
  const closeFinish =
    minLate === Infinity
      ? clamp(curve(finalMargin, [[0, 90], [3, 78], [6, 60], [10, 35], [20, 0]]))
      : clamp(curve(minLate, [[0, 100], [1, 95], [2, 88], [3, 80], [4, 70], [5, 60], [8, 40], [12, 16], [20, 0]]));

  // 2) zmiany prowadzenia w 2. połowie (period >= 3)
  let leadChanges = 0;
  let prevSign = 0;
  for (const p of pbp) {
    if (p.period < 3) continue;
    const diff = p.home - p.away;
    const sign = diff > 0 ? 1 : diff < 0 ? -1 : 0;
    if (sign !== 0 && prevSign !== 0 && sign !== prevSign) leadChanges++;
    if (sign !== 0) prevSign = sign;
  }
  const leadScore = clamp(curve(leadChanges, [[0, 0], [1, 35], [3, 58], [5, 72], [8, 85], [12, 93]]));

  const standalone = Math.round(Math.max(closeFinish, leadScore));
  const bits: string[] = [];
  if (minLate !== Infinity && minLate <= 5) bits.push(`gra na ${minLate} pkt w końcówce`);
  if (leadChanges >= 3) bits.push(`${leadChanges} zmian prowadzenia`);
  return {
    key: "clutch",
    label: "Dramat końcówki",
    detail: bits.length ? bits.join(", ") : `Różnica ${finalMargin} pkt na koniec`,
    standalone,
  };
}

/** Comeback: największy odrobiony deficyt drużyny, która ostatecznie wygrała. */
function comebackFactor(pbp: PbpPoint[], homeScore: number, awayScore: number): WatchFactor {
  if (!pbp.length || homeScore === awayScore) {
    return { key: "comeback", label: "Wielki powrót", detail: "Brak danych", standalone: 0 };
  }
  const homeWon = homeScore > awayScore;
  // deficyt zwycięzcy = max(przeciwnik - zwycięzca) w trakcie meczu
  let maxDeficit = 0;
  for (const p of pbp) {
    const winner = homeWon ? p.home : p.away;
    const loser = homeWon ? p.away : p.home;
    maxDeficit = Math.max(maxDeficit, loser - winner);
  }
  const s = clamp(curve(maxDeficit, [[7, 0], [10, 40], [15, 65], [20, 82], [25, 92], [30, 97], [40, 100]]));
  return {
    key: "comeback",
    label: "Wielki powrót",
    detail: maxDeficit >= 10 ? `Odrobione ${maxDeficit} pkt straty` : "Bez większego deficytu",
    standalone: Math.round(s),
  };
}

function shootoutFactor(combined: number): WatchFactor {
  // pułap ~62 — strzelanina sama z siebie to "warto", nie "obowiązkowo"
  const s = clamp(curve(combined, [[205, 0], [220, 24], [235, 40], [250, 54], [270, 62], [300, 62]]));
  return {
    key: "shootout",
    label: "Festiwal ofensywy",
    detail: `${combined} pkt łącznie`,
    standalone: Math.round(s),
  };
}

// --- główna funkcja --------------------------------------------------------

export type Watchability = {
  score: number;
  base: number;
  tier: WatchTier;
  context: WatchContext;
  breakdown: WatchFactor[];
};

export function computeWatchability(game: GameSummary): Watchability {
  const allPlayers = [...game.home.players, ...game.away.players];
  const finalMargin = Math.abs(game.home.score - game.away.score);
  const combined = game.home.score + game.away.score;

  const top = allPlayers.reduce(
    (best, p) => (p.pts > best.pts ? { name: p.name, pts: p.pts } : best),
    { name: "—", pts: 0 }
  );

  const tripleDoubles = allPlayers.filter((p) => p.doubleDigitCats >= 3).length;
  const quadDouble = allPlayers.some((p) => p.doubleDigitCats >= 4);
  const bigTd = allPlayers.some(
    (p) => p.doubleDigitCats >= 3 && [p.pts, p.reb, p.ast, p.stl, p.blk].some((x) => x >= 20)
  );
  const fiveByFivePlayer = allPlayers.find(
    (p) => p.pts >= 5 && p.reb >= 5 && p.ast >= 5 && p.stl >= 5 && p.blk >= 5
  );
  const maxReb = allPlayers.reduce((m, p) => Math.max(m, p.reb), 0);
  const maxAst = allPlayers.reduce((m, p) => Math.max(m, p.ast), 0);

  const factors: WatchFactor[] = [
    scoringExplosion(top),
    historicFeat({
      topPts: top.pts,
      topName: top.name,
      tripleDoubles,
      bigTd,
      quadDouble,
      fiveByFive: !!fiveByFivePlayer,
      fiveByFiveName: fiveByFivePlayer?.name ?? "",
      maxReb,
      maxAst,
    }),
    clutchFactor(game.pbp, finalMargin, game.periods),
    comebackFactor(game.pbp, game.home.score, game.away.score),
    overtimeFactor(game.periods),
    shootoutFactor(combined),
  ];

  const contextInput = {
    seasonType: game.seasonType,
    gameNote: game.gameNote,
    seriesBefore: game.seriesBefore,
  };
  const context = contextFor(contextInput);
  const stakes = stakesFactor(context, contextInput);
  if (stakes) factors.push(stakes);

  // sortuj malejąco, oznacz główny powód
  factors.sort((a, b) => b.standalone - a.standalone);
  if (factors[0]) factors[0].primary = true;

  // agregacja peak-dominant (hybryda 70/30)
  const peak = factors[0]?.standalone ?? 0;
  const rest = factors.slice(1).map((f) => f.standalone);
  const base = 0.7 * peak + 0.3 * softOr(rest);

  const score = Math.round(clamp(base * context.multiplier));

  return {
    score,
    base: Math.round(base),
    tier: tierForScore(score),
    context,
    breakdown: factors,
  };
}

