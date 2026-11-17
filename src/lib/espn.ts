// Klient nieoficjalnego (hidden) ESPN API dla NBA. Bez klucza, bez auth.
//
// Uwaga (sprawdzone 17.11.2026): scoreboard NIE przyjmuje już zakresu dat
// (`?dates=20261101-20261116` zwraca 400 "Failed to get events endpoint").
// Pojedynczy dzień działa, więc zakresy składamy z dni (getScoreboardDays).

import type { GameStatus, PlayerLine, TeamBox, TeamInfo } from "./types";
import type { SeriesBefore } from "./kontekst";
import { parseGameNumber } from "./kontekst";
import { daysBetween, espnDateToEtIso, shiftDate, toEspnDate, todayISO } from "./dates";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

// --- typy odpowiedzi ESPN (tylko pola, z których korzystamy) -----------------

type EspnTeam = {
  id?: string | number;
  displayName?: string;
  name?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  logo?: string;
  logos?: { href?: string; rel?: string[] }[];
  color?: string;
};
type EspnScore = string | number | { value?: number; displayValue?: string };
type EspnCompetitor = {
  id?: string;
  homeAway?: string;
  winner?: boolean;
  team?: EspnTeam;
  score?: EspnScore;
  linescores?: { value?: number; displayValue?: string }[];
};
type EspnStatus = {
  period?: number;
  type?: {
    name?: string;
    state?: string;
    completed?: boolean;
    detail?: string;
    shortDetail?: string;
  };
};
type EspnSeries = {
  type?: string;
  competitors?: { id?: string; wins?: number }[];
};
type EspnCompetition = {
  date?: string;
  competitors?: EspnCompetitor[];
  status?: EspnStatus;
  notes?: { headline?: string }[];
  series?: EspnSeries | EspnSeries[];
};
type EspnEvent = {
  id?: string | number;
  date?: string;
  competitions?: EspnCompetition[];
  status?: EspnStatus;
};
type EspnStatBlock = {
  labels?: string[];
  athletes?: {
    didNotPlay?: boolean;
    starter?: boolean;
    stats?: string[];
    athlete?: { displayName?: string };
  }[];
};
type EspnSummary = {
  header?: {
    season?: { type?: number | { type?: number } };
    gameNote?: string;
    competitions?: EspnCompetition[];
  };
  plays?: {
    homeScore?: number | string;
    awayScore?: number | string;
    period?: { number?: number };
    clock?: { displayValue?: string };
  }[];
  boxscore?: { players?: { team?: EspnTeam; statistics?: EspnStatBlock[] }[] };
};

// --- fetch ------------------------------------------------------------------

type FetchMode = { revalidate: number } | { noStore: true };

// Wspólny limit równoległych zapytań do ESPN dla całego procesu. CDN ESPN
// (Akamai) po serii kilkuset równoległych zapytań zaczyna odpowiadać 403 na
// wszystko z danego klienta (sprawdzone 17.11.2026: ranking liczony "30 drużyn
// × 8 naraz" wystarczył). Lepiej liczyć dłużej niż zostać odciętym.
const MAX_PARALLEL = 6;
let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

const RETRYABLE = new Set([403, 429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson<T>(url: string, mode: FetchMode): Promise<T> {
  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: { "User-Agent": "nba-watch/1.0", Accept: "application/json" },
  };
  if ("noStore" in mode) init.cache = "no-store";
  else init.next = { revalidate: mode.revalidate };

  return withSlot(async () => {
    let res = await fetch(url, init);
    if (RETRYABLE.has(res.status)) {
      await sleep(1200);
      res = await fetch(url, init);
    }
    if (!res.ok) throw new Error(`ESPN ${res.status} dla ${url}`);
    return (await res.json()) as T;
  });
}

/** Wykonuje zadania z limitem współbieżności (chroni ESPN przed zalewem zapytań). */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// --- parsowanie --------------------------------------------------------------

function toInt(v: EspnScore | undefined | null): number {
  if (v && typeof v === "object") return toInt(v.value ?? v.displayValue);
  const n = parseInt(String(v ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function parseTeam(t: EspnTeam | undefined): TeamInfo {
  const team = t ?? {};
  return {
    id: String(team.id ?? ""),
    name: team.displayName ?? team.name ?? "—",
    shortName: team.shortDisplayName ?? team.name ?? team.displayName ?? "—",
    abbreviation: team.abbreviation ?? "",
    logo: team.logo ?? team.logos?.[0]?.href ?? null,
    color: team.color ?? null,
  };
}

function statusOf(s: EspnStatus | undefined): GameStatus {
  const name = s?.type?.name ?? "";
  if (s?.type?.completed === true) return "final";
  if (name.includes("POSTPONED") || name.includes("CANCELED")) return "postponed";
  if (s?.type?.state === "in" || name.includes("HALFTIME")) return "live";
  return "scheduled";
}

function sides(comp: EspnCompetition) {
  const cs = comp.competitors ?? [];
  const home = cs.find((c) => c.homeAway === "home") ?? cs[0];
  const away = cs.find((c) => c.homeAway === "away") ?? cs[1];
  return { home, away };
}

// --- scoreboard ---------------------------------------------------------------

export type ScoreboardGame = {
  id: string;
  dateISO: string;
  startISO: string | null;
  status: GameStatus;
  away: TeamInfo;
  home: TeamInfo;
};

/**
 * Zakończone dni się nie zmieniają: trzymamy je tydzień. Ostatnie 2 dni
 * (mecze w toku, korekty statystyk) odświeżamy co 5 minut.
 */
function revalidateForDay(iso: string): number {
  return daysBetween(iso, todayISO()) >= 2 ? 7 * 24 * 3600 : 300;
}

/** Mecze jednego dnia (data wg ET, YYYY-MM-DD). */
export async function getScoreboard(iso: string): Promise<ScoreboardGame[]> {
  const data = await fetchJson<{ events?: EspnEvent[] }>(
    `${BASE}/scoreboard?dates=${toEspnDate(iso)}`,
    { revalidate: revalidateForDay(iso) }
  );
  return (data.events ?? []).map((ev) => {
    const comp = ev.competitions?.[0] ?? {};
    const { home, away } = sides(comp);
    const start = ev.date ?? comp.date ?? null;
    return {
      id: String(ev.id),
      dateISO: start ? espnDateToEtIso(start) : iso,
      startISO: start,
      status: statusOf(comp.status ?? ev.status),
      away: parseTeam(away?.team),
      home: parseTeam(home?.team),
    };
  });
}

/** Mecze z zakresu dni (włącznie). Zastępuje zepsuty zakres w scoreboardzie. */
export async function getScoreboardDays(
  fromIso: string,
  toIso: string
): Promise<ScoreboardGame[]> {
  const days: string[] = [];
  for (let d = fromIso; d <= toIso; d = shiftDate(d, 1)) days.push(d);
  const perDay = await mapLimit(days, 6, async (d) => {
    try {
      return await getScoreboard(d);
    } catch {
      return [] as ScoreboardGame[];
    }
  });
  return perDay.flat();
}

// --- drużyny i terminarz ---------------------------------------------------------

/** Wszystkie drużyny NBA (do strony przeglądania). */
export async function getTeams(): Promise<TeamInfo[]> {
  const data = await fetchJson<{
    sports?: { leagues?: { teams?: { team?: EspnTeam }[] }[] }[];
  }>(`${BASE}/teams`, { revalidate: 24 * 3600 });
  const list = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return list.map((t) => parseTeam(t.team)).sort((a, b) => a.name.localeCompare(b.name));
}

export type TeamScheduleGame = {
  id: string;
  dateISO: string;
  startISO: string | null;
  opponent: TeamInfo;
  isHome: boolean;
  postseason: boolean;
};

async function scheduleEvents(teamId: string, season: number, seasonType: 2 | 3) {
  try {
    return await fetchJson<{ team?: EspnTeam; events?: EspnEvent[] }>(
      `${BASE}/teams/${teamId}/schedule?season=${season}&seasontype=${seasonType}`,
      { revalidate: 3600 }
    );
  } catch (e) {
    if (seasonType === 3) return { events: [] as EspnEvent[] }; // brak play-off to nie błąd
    throw e;
  }
}

/**
 * Zakończone mecze drużyny w sezonie (rok zakończenia, np. 2027 = sezon 2026/27):
 * sezon zasadniczy i play-off. Bez wyników, bo te są spoilerem.
 */
export async function getTeamSchedule(
  teamId: string,
  season: number
): Promise<{ team: TeamInfo; games: TeamScheduleGame[] }> {
  const [regular, post] = await Promise.all([
    scheduleEvents(teamId, season, 2),
    scheduleEvents(teamId, season, 3),
  ]);
  const team = parseTeam(regular.team ?? { id: teamId });
  // terminarz zwraca logo jako `team.logo` albo `logos[]`, parseTeam łapie oba

  const toGames = (events: EspnEvent[] | undefined, postseason: boolean) =>
    (events ?? [])
      .filter((ev) => statusOf(ev.competitions?.[0]?.status) === "final")
      .map((ev): TeamScheduleGame => {
        const comp = ev.competitions?.[0] ?? {};
        const cs = comp.competitors ?? [];
        const mine = cs.find((c) => String(c.team?.id) === String(teamId));
        const opp = cs.find((c) => String(c.team?.id) !== String(teamId));
        const start = ev.date ?? comp.date ?? null;
        return {
          id: String(ev.id),
          dateISO: start ? espnDateToEtIso(start) : "",
          startISO: start,
          opponent: parseTeam(opp?.team),
          isHome: mine?.homeAway === "home",
          postseason,
        };
      });

  return {
    team,
    games: [...toGames(regular.events, false), ...toGames(post.events, true)],
  };
}

// --- szczegóły meczu (summary) -------------------------------------------------

/** Znajduje indeks statystyki po etykiecie (ESPN bywa niespójny w kolejności). */
function statIndex(labels: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = labels.findIndex((l) => l?.toUpperCase() === c.toUpperCase());
    if (i !== -1) return i;
  }
  return -1;
}

/** "9:51" -> 591 (sekundy pozostałe w danej kwarcie). */
function clockToSeconds(disp: string | undefined): number | null {
  const m = /(\d+):(\d+)(?:\.\d+)?/.exec(disp ?? "");
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Lekki punkt z play-by-play — tylko to, co potrzebne do scoringu. */
export type PbpPoint = {
  home: number;
  away: number;
  period: number; // 1-4 = kwarty, 5+ = dogrywki
  sec: number | null; // sekundy do końca kwarty
};

function parsePlayers(block: { statistics?: EspnStatBlock[] } | undefined): PlayerLine[] {
  const stat = block?.statistics?.[0] ?? {};
  const labels = stat.labels ?? [];
  const at = (s: string[], i: number) => (i >= 0 ? s[i] : undefined);

  const iMin = statIndex(labels, "MIN");
  const iPts = statIndex(labels, "PTS");
  const iReb = statIndex(labels, "REB");
  const iAst = statIndex(labels, "AST");
  const iStl = statIndex(labels, "STL");
  const iBlk = statIndex(labels, "BLK");
  const iTo = statIndex(labels, "TO");
  const iFg = statIndex(labels, "FG");
  const iTp = statIndex(labels, "3PT");
  const iFt = statIndex(labels, "FT");

  return (stat.athletes ?? [])
    .filter((a) => !a.didNotPlay && Array.isArray(a.stats) && a.stats.length > 0)
    .map((a) => {
      const s = a.stats ?? [];
      const pts = toInt(at(s, iPts));
      const reb = toInt(at(s, iReb));
      const ast = toInt(at(s, iAst));
      const stl = toInt(at(s, iStl));
      const blk = toInt(at(s, iBlk));
      return {
        name: a.athlete?.displayName ?? "—",
        starter: a.starter === true,
        min: toInt(at(s, iMin)),
        pts,
        reb,
        ast,
        stl,
        blk,
        fg: at(s, iFg) ?? "0-0",
        tp: at(s, iTp) ?? "0-0",
        ft: at(s, iFt) ?? "0-0",
        to: toInt(at(s, iTo)),
        doubleDigitCats: [pts, reb, ast, stl, blk].filter((x) => x >= 10).length,
      };
    });
}

/**
 * Stan serii play-off PRZED meczem. ESPN podaje go po meczu (migawka z chwili
 * meczu, nie stan bieżący), więc odejmujemy zwycięstwo z tego meczu. Gdy suma
 * wygranych nie zgadza się z numerem meczu, nie ufamy danym.
 */
function seriesBeforeGame(
  comp: EspnCompetition,
  gameNote: string,
  homeId: string,
  awayId: string
): SeriesBefore | null {
  const list = Array.isArray(comp.series) ? comp.series : comp.series ? [comp.series] : [];
  const po = list.find((s) => s?.type === "playoff");
  if (!po?.competitors?.length) return null;

  const winsAfter = (id: string) =>
    Number(po.competitors?.find((c) => String(c.id) === id)?.wins ?? NaN);
  const { home, away } = sides(comp);
  const homeWins = winsAfter(homeId) - (home?.winner ? 1 : 0);
  const awayWins = winsAfter(awayId) - (away?.winner ? 1 : 0);
  if (!Number.isFinite(homeWins) || !Number.isFinite(awayWins)) return null;
  if (homeWins < 0 || awayWins < 0) return null;

  const game = parseGameNumber(gameNote);
  if (game !== null && homeWins + awayWins !== game - 1) return null;
  return { homeWins, awayWins };
}

export type GameSummary = {
  id: string;
  completed: boolean;
  periods: number;
  seasonType: number | null; // 2 = sezon zasadniczy, 3 = play-off, 5 = play-in
  gameNote: string; // np. "NBA Finals - Game 7"
  seriesBefore: SeriesBefore | null;
  pbp: PbpPoint[];
  home: TeamBox;
  away: TeamBox;
};

/**
 * Pełne dane meczu: box score + wynik + play-by-play (~400 KB JSON).
 * Bez Data Cache: zapisujemy tylko wyliczoną ocenę (scores.ts), a odpowiedź
 * /api/game/[id] i tak trzyma CDN.
 */
export async function getGameSummary(gameId: string): Promise<GameSummary> {
  const data = await fetchJson<EspnSummary>(`${BASE}/summary?event=${gameId}`, {
    noStore: true,
  });

  const comp = data.header?.competitions?.[0] ?? {};
  const st = data.header?.season?.type;
  const seasonType = typeof st === "number" ? st : typeof st?.type === "number" ? st.type : null;
  const gameNote = data.header?.gameNote ?? comp.notes?.[0]?.headline ?? "";

  const pbp: PbpPoint[] = (data.plays ?? [])
    .map((p) => ({
      home: toInt(p.homeScore),
      away: toInt(p.awayScore),
      period: Number(p.period?.number ?? 0),
      sec: clockToSeconds(p.clock?.displayValue),
    }))
    .filter((p) => p.period > 0);

  // Liczba kwart: 1) z linescores (po jednej na kwartę), 2) z detalu statusu
  // ("Final/OT", "Final/2OT"), 3) z period, jeśli jest.
  const linescores = comp.competitors?.[0]?.linescores ?? [];
  const detail = comp.status?.type?.detail ?? comp.status?.type?.shortDetail ?? "";
  const otMatch = detail.match(/(\d*)\s*OT/i);
  let periods = 4;
  if (linescores.length >= 4) periods = linescores.length;
  else if (otMatch) periods = 4 + (otMatch[1] ? parseInt(otMatch[1], 10) : 1);
  else if (Number(comp.status?.period) >= 4) periods = Number(comp.status?.period);

  const boxTeams = data.boxscore?.players ?? [];
  const { home: homeC, away: awayC } = sides(comp);

  const build = (c: EspnCompetitor | undefined, homeAway: "home" | "away"): TeamBox => {
    const team = parseTeam(c?.team);
    const bp =
      boxTeams.find((b) => String(b.team?.id ?? "") === team.id) ??
      boxTeams[homeAway === "home" ? boxTeams.length - 1 : 0];
    return {
      team,
      homeAway,
      score: toInt(c?.score),
      linescore: (c?.linescores ?? []).map((l) => toInt(l.value ?? l.displayValue)),
      players: parsePlayers(bp),
    };
  };

  const home = build(homeC, "home");
  const away = build(awayC, "away");

  return {
    id: gameId,
    completed: comp.status?.type?.completed === true,
    periods,
    seasonType,
    gameNote,
    seriesBefore: seriesBeforeGame(comp, gameNote, home.team.id, away.team.id),
    pbp,
    home,
    away,
  };
}
