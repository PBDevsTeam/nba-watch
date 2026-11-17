import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWatchability, tierForScore } from "./watchability";
import type { GameSummary, PbpPoint } from "./espn";
import type { PlayerLine, TeamBox } from "./types";

function player(name: string, pts: number, reb = 4, ast = 3): PlayerLine {
  return {
    name, starter: true, min: 34, pts, reb, ast, stl: 1, blk: 0,
    fg: "0-0", tp: "0-0", ft: "0-0", to: 2,
    doubleDigitCats: [pts, reb, ast].filter((x) => x >= 10).length,
  };
}

function box(homeAway: "home" | "away", score: number, top: number): TeamBox {
  return {
    team: { id: homeAway === "home" ? "1" : "2", name: homeAway, shortName: homeAway,
      abbreviation: homeAway === "home" ? "HOM" : "AWY", logo: null, color: null },
    homeAway, score, linescore: [], players: [player(`${homeAway}-gwiazda`, top), player(`${homeAway}-2`, 14)],
  };
}

/** Przebieg, w którym gospodarz prowadzi stale o `lead` (bez dramatu). */
function steadyPbp(lead: number): PbpPoint[] {
  const out: PbpPoint[] = [];
  for (let period = 1; period <= 4; period++) {
    for (let sec = 700; sec >= 0; sec -= 60) {
      const h = period * 25 + Math.round((720 - sec) / 30);
      out.push({ home: h + lead, away: h, period, sec });
    }
  }
  return out;
}

function game(over: Partial<GameSummary>): GameSummary {
  return {
    id: "1", completed: true, periods: 4, seasonType: 2, gameNote: "", seriesBefore: null,
    pbp: steadyPbp(12), home: box("home", 103, 29), away: box("away", 91, 22), ...over,
  };
}

test("mecz 7 Finałów wygrany 12 punktami nie jest już 'do odpuszczenia'", () => {
  // Stary model (mnożnik nie działał, brak stawki) dawał temu meczowi 32/100.
  const g7 = computeWatchability(game({
    seasonType: 3, gameNote: "NBA Finals - Game 7", seriesBefore: { homeWins: 3, awayWins: 3 },
  }));
  assert.equal(g7.context.kind, "finals");
  assert.equal(g7.breakdown[0].key, "stakes");
  assert.ok(g7.score >= 70, `ocena ${g7.score}`);
});

test("ten sam przebieg w sezonie zasadniczym ocenia się nisko", () => {
  const r = computeWatchability(game({}));
  assert.equal(r.context.kind, "regular");
  assert.ok(r.score < 40, `ocena ${r.score}`);
  assert.equal(r.tier.key, "skip");
});

test("dogrywka podnosi ocenę zwykłego meczu", () => {
  const plain = computeWatchability(game({}));
  const ot = computeWatchability(game({ periods: 5 }));
  assert.ok(ot.score > plain.score);
});

test("progi poziomów", () => {
  assert.equal(tierForScore(100).key, "must");
  assert.equal(tierForScore(85).key, "must");
  assert.equal(tierForScore(84).key, "great");
  assert.equal(tierForScore(55).key, "good");
  assert.equal(tierForScore(40).key, "average");
  assert.equal(tierForScore(39).key, "skip");
  assert.equal(tierForScore(0).key, "skip");
});
