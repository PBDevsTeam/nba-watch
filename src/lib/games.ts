// Orkiestracja: scoreboard + summary -> lekkie GamePreview (bez spoilerów).

import {
  getGameSummary,
  getScoreboard,
  getScoreboardRange,
  getTeamSchedule,
  getTeams,
} from "./espn";
import type { PbpPoint } from "./espn";
import { toEspnDate } from "./dates";
import { computeWatchability } from "./watchability";
import { getCachedScores } from "./scores";
import type { FlowPoint, GamePreview, GameReveal, TeamInfo, WatchTier } from "./types";

/**
 * Najlepszy wskaźnik dla KAŻDEGO dnia w zakresie (np. miesiąc), liczony PEŁNYM
 * modelem (z cache per mecz). Zwraca mapę { "YYYY-MM-DD": bestScore }. Zasila
 * heatmapę kalendarza — kropka = dokładnie ta sama ocena co po wejściu w mecz.
 */
export async function getDayHeat(
  fromIso: string,
  toIso: string
): Promise<Record<string, number>> {
  const games = (
    await getScoreboardRange(toEspnDate(fromIso), toEspnDate(toIso))
  ).filter((g) => g.completed && g.dateISO >= fromIso && g.dateISO <= toIso);

  const scores = await getCachedScores(games.map((g) => g.id));

  const heat: Record<string, number> = {};
  for (const g of games) {
    const s = scores.get(g.id)?.score;
    if (s === undefined) continue;
    if (heat[g.dateISO] === undefined || s > heat[g.dateISO]) heat[g.dateISO] = s;
  }
  return heat;
}

export type TeamGameRow = {
  id: string;
  dateISO: string;
  opponent: TeamInfo;
  isHome: boolean;
  watchScore: number;
  tier: WatchTier;
};

export type TeamSeasonView = {
  team: TeamInfo;
  season: number;
  games: TeamGameRow[]; // posortowane wg wskaźnika malejąco
  avgScore: number;
  bestScore: number;
  played: number;
};

/**
 * Mecze drużyny w sezonie z PEŁNYM wskaźnikiem (z cache per mecz).
 * Sortowane wg wskaźnika malejąco, by od razu pokazać "najlepsze mecze".
 */
export async function getTeamSeason(
  teamId: string,
  season: number
): Promise<TeamSeasonView> {
  const { team, games } = await getTeamSchedule(teamId, season);
  const scores = await getCachedScores(games.map((g) => g.id));

  const rows: TeamGameRow[] = games
    .map((g): TeamGameRow | null => {
      const cs = scores.get(g.id);
      if (!cs) return null;
      return {
        id: g.id,
        dateISO: g.dateISO,
        opponent: g.opponent,
        isHome: g.isHome,
        watchScore: cs.score,
        tier: cs.tier,
      };
    })
    .filter((r): r is TeamGameRow => r !== null);

  const scoreVals = rows.map((r) => r.watchScore);
  const avgScore = scoreVals.length
    ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length)
    : 0;
  const bestScore = scoreVals.length ? Math.max(...scoreVals) : 0;

  rows.sort((a, b) => b.watchScore - a.watchScore);

  return { team, season, games: rows, avgScore, bestScore, played: rows.length };
}

export { getTeams };

export type TopGame = {
  id: string;
  dateISO: string;
  home: TeamInfo;
  away: TeamInfo;
  watchScore: number;
  tier: WatchTier;
};

/**
 * Top mecze z zakresu dat, PEŁNY model (z cache per mecz).
 * Używane do "Top 10 do obejrzenia" w rankingu.
 */
export async function getTopGames(
  fromIso: string,
  toIso: string,
  limit = 10
): Promise<TopGame[]> {
  const games = (
    await getScoreboardRange(toEspnDate(fromIso), toEspnDate(toIso))
  ).filter((g) => g.completed && g.dateISO >= fromIso && g.dateISO <= toIso);

  const scores = await getCachedScores(games.map((g) => g.id));

  const scored: TopGame[] = games
    .map((g): TopGame | null => {
      const cs = scores.get(g.id);
      if (!cs) return null;
      return {
        id: g.id,
        dateISO: g.dateISO,
        home: g.home,
        away: g.away,
        watchScore: cs.score,
        tier: cs.tier,
      };
    })
    .filter((t): t is TopGame => t !== null);

  scored.sort((a, b) => b.watchScore - a.watchScore);
  return scored.slice(0, limit);
}

export type Conference = "east" | "west";

/** Stała przynależność do konferencji (NBA nie zmienia tego między sezonami). */
const CONFERENCE: Record<string, Conference> = {
  // Wschód
  BOS: "east", BKN: "east", NY: "east", PHI: "east", TOR: "east",
  CHI: "east", CLE: "east", DET: "east", IND: "east", MIL: "east",
  ATL: "east", CHA: "east", MIA: "east", ORL: "east", WSH: "east",
  // Zachód
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
  mustWatch: number; // mecze >=85
  conference: Conference | null;
};

/**
 * Ranking drużyn wg średniej "jakości" meczów w sezonie (heurystyka).
 * Liczy 30 harmonogramów równolegle. Wynik mocno cache'owany przez ESPN revalidate.
 */
export async function getSeasonRanking(season: number): Promise<RankingRow[]> {
  const teams = await getTeams();
  const rows = await Promise.all(
    teams.map(async (t): Promise<RankingRow | null> => {
      try {
        const view = await getTeamSeason(t.id, season);
        const mustWatch = view.games.filter((g) => g.watchScore >= 85).length;
        return {
          team: view.team,
          avgScore: view.avgScore,
          bestScore: view.bestScore,
          played: view.played,
          mustWatch,
          conference: conferenceOf(view.team.abbreviation),
        };
      } catch {
        return null;
      }
    })
  );
  return rows
    .filter((r): r is RankingRow => r !== null && r.played > 0)
    .sort((a, b) => b.avgScore - a.avgScore);
}

/**
 * Buduje przebieg różnicy punktowej (home - away) z play-by-play.
 * Próbkuje do ~90 punktów, by payload był lekki, zachowując kształt
 * (comebacki, zmiany prowadzenia). t = postęp meczu 0..1.
 */
function buildFlow(pbp: PbpPoint[], periods: number): FlowPoint[] {
  if (!pbp.length) return [];
  const totalPeriods = Math.max(4, periods);
  // czas meczu jako liczba: (period-1) + (1 - sec/dł_kwarty)
  const periodLen = (p: number) => (p <= 4 ? 720 : 300); // 12 min / 5 min OT
  const raw = pbp
    .map((p) => {
      const len = periodLen(p.period);
      const elapsedInPeriod = p.sec === null ? 0 : (len - p.sec) / len;
      const t = (p.period - 1 + elapsedInPeriod) / totalPeriods;
      return { t: Math.max(0, Math.min(1, t)), diff: p.home - p.away, period: p.period };
    })
    .sort((a, b) => a.t - b.t);

  // próbkowanie: max 90 punktów
  const MAX = 90;
  if (raw.length <= MAX) return raw;
  const step = raw.length / MAX;
  const out: FlowPoint[] = [];
  for (let i = 0; i < MAX; i++) out.push(raw[Math.floor(i * step)]);
  out.push(raw[raw.length - 1]); // zawsze ostatni (wynik końcowy)
  return out;
}

/**
 * Zwraca podglądy meczów danego dnia, posortowane wg wskaźnika malejąco.
 * Wskaźnik liczony serwerowo z box score; do klienta NIE trafia wynik.
 */
export async function getPreviewsForDate(iso: string): Promise<GamePreview[]> {
  const games = await getScoreboard(toEspnDate(iso));
  const completed = games.filter((g) => g.completed);

  const previews = await Promise.all(
    completed.map(async (g): Promise<GamePreview | null> => {
      try {
        const summary = await getGameSummary(g.id);
        const { score, tier, context } = computeWatchability(summary);
        return {
          id: g.id,
          dateISO: iso,
          away: g.away,
          home: g.home,
          watchScore: score,
          tier,
          context,
        };
      } catch {
        return null;
      }
    })
  );

  return previews
    .filter((p): p is GamePreview => p !== null)
    .sort((a, b) => b.watchScore - a.watchScore);
}

/** Pełne dane meczu (spoilery) — używane przez /api/game/[id] po revealu. */
export async function getReveal(gameId: string): Promise<GameReveal> {
  const summary = await getGameSummary(gameId);
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
