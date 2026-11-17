// Orkiestracja: scoreboard + oceny z cache -> obiekty dla stron (bez spoilerów).

import { unstable_cache } from "next/cache";
import {
  getGameSummary,
  getScoreboard,
  getScoreboardDays,
  getTeamSchedule,
  getTeams,
} from "./espn";
import type { PbpPoint, ScoreboardGame } from "./espn";
import { computeWatchability, MODEL_VERSION } from "./watchability";
import { getCachedScores } from "./scores";
import type {
  FlowPoint,
  GamePreview,
  GameReveal,
  TeamInfo,
  WatchContext,
  WatchTier,
} from "./types";

export { getTeams };

/** Ile czasu (ms) strona może poświęcić na dociąganie brakujących ocen. */
const PAGE_BUDGET_MS = 35_000;

const deadlineIn = (ms: number) => Date.now() + ms;

// --- dzień meczowy ------------------------------------------------------------------

const STATUS_ORDER: Record<GamePreview["status"], number> = {
  final: 0,
  live: 1,
  scheduled: 2,
  postponed: 3,
};

/**
 * Mecze danego dnia: zakończone z oceną (malejąco), potem trwające i zaplanowane
 * wg godziny. Do klienta NIE trafia wynik.
 */
export async function getPreviewsForDate(iso: string): Promise<GamePreview[]> {
  const games = await getScoreboard(iso);
  const finals = games.filter((g) => g.status === "final").map((g) => g.id);
  const scores = await getCachedScores(finals, { deadline: deadlineIn(PAGE_BUDGET_MS) });

  const previews: GamePreview[] = games.map((g) => {
    const cs = g.status === "final" ? scores.get(g.id) : undefined;
    return {
      id: g.id,
      dateISO: iso,
      startISO: g.startISO,
      status: g.status,
      away: g.away,
      home: g.home,
      watchScore: cs?.score ?? null,
      tier: cs?.tier ?? null,
      context: cs?.context ?? null,
    };
  });

  return previews.sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (a.watchScore !== null || b.watchScore !== null) {
      return (b.watchScore ?? -1) - (a.watchScore ?? -1);
    }
    return (a.startISO ?? "").localeCompare(b.startISO ?? "");
  });
}

// --- heatmapa kalendarza -----------------------------------------------------------

export type DayHeat = { heat: Record<string, number>; complete: boolean };

/**
 * Najlepsza ocena każdego dnia w zakresie, liczona PEŁNYM modelem (z cache per
 * mecz). Kropka w kalendarzu = dokładnie ta sama ocena co po wejściu w mecz.
 */
export async function getDayHeat(fromIso: string, toIso: string): Promise<DayHeat> {
  const games = (await getScoreboardDays(fromIso, toIso)).filter(
    (g) => g.status === "final"
  );
  const scores = await getCachedScores(
    games.map((g) => g.id),
    { deadline: deadlineIn(PAGE_BUDGET_MS) }
  );

  const heat: Record<string, number> = {};
  for (const g of games) {
    const s = scores.get(g.id)?.score;
    if (s === undefined) continue;
    if (heat[g.dateISO] === undefined || s > heat[g.dateISO]) heat[g.dateISO] = s;
  }
  return { heat, complete: scores.size === new Set(games.map((g) => g.id)).size };
}

// --- najlepsze mecze z ostatnich dni -----------------------------------------------

export type TopGame = {
  id: string;
  dateISO: string;
  startISO: string | null;
  home: TeamInfo;
  away: TeamInfo;
  watchScore: number;
  tier: WatchTier;
  context: WatchContext;
};

function scoredGames(
  games: ScoreboardGame[],
  scores: Awaited<ReturnType<typeof getCachedScores>>
): TopGame[] {
  return games.flatMap((g) => {
    const cs = scores.get(g.id);
    if (!cs) return [];
    return [
      {
        id: g.id,
        dateISO: g.dateISO,
        startISO: g.startISO,
        home: g.home,
        away: g.away,
        watchScore: cs.score,
        tier: cs.tier,
        context: cs.context,
      },
    ];
  });
}

/** Najlepsze mecze z zakresu dat, PEŁNY model (z cache per mecz). */
export async function getTopGames(
  fromIso: string,
  toIso: string,
  limit = 10
): Promise<TopGame[]> {
  const games = (await getScoreboardDays(fromIso, toIso)).filter(
    (g) => g.status === "final"
  );
  const scores = await getCachedScores(
    games.map((g) => g.id),
    { deadline: deadlineIn(PAGE_BUDGET_MS) }
  );
  return scoredGames(games, scores)
    .sort((a, b) => b.watchScore - a.watchScore)
    .slice(0, limit);
}

// --- drużyna -----------------------------------------------------------------------

export type TeamGameRow = {
  id: string;
  dateISO: string;
  startISO: string | null;
  opponent: TeamInfo;
  isHome: boolean;
  postseason: boolean;
  watchScore: number;
  tier: WatchTier;
  context: WatchContext;
};

export type TeamSeasonView = {
  team: TeamInfo;
  season: number;
  games: TeamGameRow[]; // chronologicznie
  avgScore: number;
  bestScore: number;
  played: number; // zakończone mecze w sezonie
  rated: number; // mecze z policzoną oceną
};

/** Mecze drużyny w sezonie z PEŁNĄ oceną (z cache per mecz). */
export async function getTeamSeason(
  teamId: string,
  season: number,
  opts: { deadline?: number; includePostseason?: boolean } = {}
): Promise<TeamSeasonView> {
  const { team, games: all } = await getTeamSchedule(teamId, season);
  const games = opts.includePostseason === false ? all.filter((g) => !g.postseason) : all;
  const scores = await getCachedScores(
    games.map((g) => g.id),
    { deadline: opts.deadline ?? deadlineIn(PAGE_BUDGET_MS) }
  );

  const rows: TeamGameRow[] = games
    .flatMap((g) => {
      const cs = scores.get(g.id);
      if (!cs) return [];
      return [{ ...g, watchScore: cs.score, tier: cs.tier, context: cs.context }];
    })
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const vals = rows.map((r) => r.watchScore);
  return {
    team,
    season,
    games: rows,
    avgScore: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
    bestScore: vals.length ? Math.max(...vals) : 0,
    played: games.length,
    rated: rows.length,
  };
}

// --- ranking drużyn -----------------------------------------------------------------

export type Conference = "east" | "west";

/** Stała przynależność do konferencji (skróty jak w ESPN). */
const CONFERENCE: Record<string, Conference> = {
  BOS: "east", BKN: "east", NY: "east", PHI: "east", TOR: "east",
  CHI: "east", CLE: "east", DET: "east", IND: "east", MIL: "east",
  ATL: "east", CHA: "east", MIA: "east", ORL: "east", WSH: "east",
  DEN: "west", MIN: "west", OKC: "west", POR: "west", UTAH: "west",
  GS: "west", LAC: "west", LAL: "west", PHX: "west", SAC: "west",
  DAL: "west", HOU: "west", MEM: "west", NO: "west", SA: "west",
};

export function conferenceOf(abbr: string): Conference | null {
  return CONFERENCE[abbr] ?? null;
}

export type RankingRow = {
  team: TeamInfo;
  avgScore: number;
  bestScore: number;
  played: number;
  mustWatch: number; // mecze >= 85
  conference: Conference | null;
};

export type SeasonRanking = {
  season: number;
  rows: RankingRow[];
  complete: boolean; // false = część ocen jeszcze się liczy
};

/** Ranking drużyn wg średniej oceny meczów sezonu zasadniczego. */
async function computeSeasonRanking(season: number, deadline: number): Promise<SeasonRanking> {
  const teams = await getTeams();
  let complete = true;
  const rows = await Promise.all(
    teams.map(async (t): Promise<RankingRow | null> => {
      try {
        const view = await getTeamSeason(t.id, season, {
          deadline,
          includePostseason: false,
        });
        if (view.rated < view.played) complete = false;
        return {
          team: view.team,
          avgScore: view.avgScore,
          bestScore: view.bestScore,
          played: view.rated,
          mustWatch: view.games.filter((g) => g.watchScore >= 85).length,
          conference: conferenceOf(view.team.abbreviation),
        };
      } catch {
        complete = false;
        return null;
      }
    })
  );
  return {
    season,
    complete,
    rows: rows
      .filter((r): r is RankingRow => r !== null && r.played > 0)
      .sort((a, b) => b.avgScore - a.avgScore),
  };
}

class IncompleteRanking extends Error {}

// Pełny ranking trzymamy godzinę. Niepełnego NIE zapisujemy (rzucamy), żeby nie
// utknął w cache; per-mecz oceny i tak zostają, więc kolejna próba jest szybsza.
const cachedCompleteRanking = unstable_cache(
  async (season: number): Promise<SeasonRanking> => {
    const r = await computeSeasonRanking(season, deadlineIn(PAGE_BUDGET_MS));
    if (!r.complete) throw new IncompleteRanking();
    return r;
  },
  ["ranking-druzyn", `model-${MODEL_VERSION}`],
  { revalidate: 3600, tags: ["ranking"] }
);

export async function getSeasonRanking(season: number): Promise<SeasonRanking> {
  try {
    return await cachedCompleteRanking(season);
  } catch {
    // Zimny cache: pokaż to, co już policzone (krótki budżet, bo oceny są już ciepłe).
    return computeSeasonRanking(season, deadlineIn(8_000));
  }
}

// --- odkrycie wyniku ------------------------------------------------------------------

/**
 * Przebieg różnicy punktowej (home - away) z play-by-play. Próbkuje do ~90
 * punktów, by payload był lekki, zachowując kształt (comebacki, zmiany
 * prowadzenia). t = postęp meczu 0..1.
 */
function buildFlow(pbp: PbpPoint[], periods: number): FlowPoint[] {
  if (!pbp.length) return [];
  const totalPeriods = Math.max(4, periods);
  const periodLen = (p: number) => (p <= 4 ? 720 : 300); // 12 min / 5 min OT
  // Oś czasu: 4 kwarty po 12 min + dogrywki po 5 min, proporcjonalnie.
  const totalSec = 4 * 720 + Math.max(0, totalPeriods - 4) * 300;
  const startOf = (p: number) => (p <= 4 ? (p - 1) * 720 : 4 * 720 + (p - 5) * 300);

  const raw = pbp
    .map((p) => {
      const len = periodLen(p.period);
      const elapsed = p.sec === null ? 0 : len - p.sec;
      const t = (startOf(p.period) + elapsed) / totalSec;
      return { t: Math.max(0, Math.min(1, t)), diff: p.home - p.away, period: p.period };
    })
    .sort((a, b) => a.t - b.t);

  const MAX = 90;
  if (raw.length <= MAX) return raw;
  const step = raw.length / MAX;
  const out: FlowPoint[] = [];
  for (let i = 0; i < MAX; i++) out.push(raw[Math.floor(i * step)]);
  out.push(raw[raw.length - 1]); // zawsze ostatni (wynik końcowy)
  return out;
}

export class GameNotFinished extends Error {}

/** Pełne dane meczu (spoilery) — używane przez /api/game/[id] po odkryciu. */
export async function getReveal(gameId: string): Promise<GameReveal> {
  const summary = await getGameSummary(gameId);
  if (!summary.completed) throw new GameNotFinished();
  const { score, base, tier, context, breakdown } = computeWatchability(summary);
  return {
    id: gameId,
    away: summary.away,
    home: summary.home,
    periods: summary.periods,
    watchScore: score,
    tier,
    context,
    base,
    breakdown,
    flow: buildFlow(summary.pbp, summary.periods),
  };
}
