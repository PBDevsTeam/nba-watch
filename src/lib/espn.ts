// Klient nieoficjalnego (hidden) ESPN API dla NBA.
// Bez klucza, bez auth. Dane meczów zakończonych są statyczne -> mocno cache'ujemy.

import type { PlayerLine, TeamBox, TeamInfo } from "./types";
import { espnDateToEtIso } from "./dates";

const SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const SUMMARY =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary";

// Zakończone mecze się nie zmieniają -> długi cache. Rewalidacja co godzinę
// na wypadek korekt statystyk / opóźnionych meczów tego samego dnia.
const REVALIDATE = 60 * 60;

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE },
    headers: { "User-Agent": "nba-watch/1.0 (+https://github.com)" },
  });
  if (!res.ok) {
    throw new Error(`ESPN ${res.status} dla ${url}`);
  }
  return res.json();
}

function parseTeam(competitor: any): TeamInfo {
  const t = competitor?.team ?? {};
  return {
    id: String(t.id ?? ""),
    name: t.displayName ?? t.name ?? "—",
    shortName: t.shortDisplayName ?? t.name ?? t.displayName ?? "—",
    abbreviation: t.abbreviation ?? "",
    logo: t.logo ?? t.logos?.[0]?.href ?? null,
    color: t.color ?? null,
  };
}

export type ScoreboardGame = {
  id: string;
  dateISO: string;
  completed: boolean;
  periods: number;
  away: TeamInfo;
  home: TeamInfo;
  /** Wyniki ze scoreboardu (spoiler — używane TYLKO do liczenia heurystyki serwerowo). */
  awayScore: number;
  homeScore: number;
  /** Najwięcej pkt w meczu wg leaderów scoreboardu (do heurystyki). */
  topPts: number;
  seasonTypeName: string;
};

function leadersTopPts(comp: any): number {
  // scoreboard zawiera comp.competitors[].leaders[] z kategorią "points"
  let best = 0;
  for (const c of comp?.competitors ?? []) {
    for (const cat of c?.leaders ?? []) {
      if ((cat?.name ?? cat?.abbreviation ?? "").toLowerCase().includes("point")) {
        for (const l of cat?.leaders ?? []) {
          const v = Number(l?.value ?? 0);
          if (v > best) best = v;
        }
      }
    }
  }
  return best;
}

function parseScoreboardEvents(data: any): ScoreboardGame[] {
  const events: any[] = data?.events ?? [];
  const seasonTypeName: string = data?.season?.type?.name ?? "Regular Season";
  return events.map((ev) => {
    const comp = ev?.competitions?.[0] ?? {};
    const competitors: any[] = comp?.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
    const away = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
    const status = comp?.status ?? ev?.status ?? {};
    return {
      id: String(ev.id),
      dateISO: espnDateToEtIso(ev.date ?? ""),
      completed: status?.type?.completed === true,
      periods: Number(status?.period ?? 4),
      away: parseTeam(away),
      home: parseTeam(home),
      awayScore: toInt(away?.score),
      homeScore: toInt(home?.score),
      topPts: leadersTopPts(comp),
      seasonTypeName: ev?.season?.type?.name ?? seasonTypeName,
    };
  });
}

/** Mecze dla zakresu dat (YYYYMMDD-YYYYMMDD) — jeden request na cały miesiąc. */
export async function getScoreboardRange(
  fromYmd: string,
  toYmd: string
): Promise<ScoreboardGame[]> {
  const data = await fetchJson(`${SCOREBOARD}?dates=${fromYmd}-${toYmd}&limit=400`);
  return parseScoreboardEvents(data);
}

/** Lista meczów danego dnia (YYYYMMDD), z danymi do heurystyki. */
export async function getScoreboard(yyyymmdd: string): Promise<ScoreboardGame[]> {
  const data = await fetchJson(`${SCOREBOARD}?dates=${yyyymmdd}`);
  const events: any[] = data?.events ?? [];
  const seasonTypeName: string = data?.season?.type?.name ?? "Regular Season";
  return events.map((ev) => {
    const comp = ev?.competitions?.[0] ?? {};
    const competitors: any[] = comp?.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
    const away = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
    const status = comp?.status ?? ev?.status ?? {};
    return {
      id: String(ev.id),
      dateISO: espnDateToEtIso(ev.date ?? ""),
      completed: status?.type?.completed === true,
      periods: Number(status?.period ?? 4),
      away: parseTeam(away),
      home: parseTeam(home),
      awayScore: toInt(away?.score),
      homeScore: toInt(home?.score),
      topPts: leadersTopPts(comp),
      seasonTypeName: ev?.season?.type?.name ?? seasonTypeName,
    };
  });
}

// --- drużyny i harmonogram -------------------------------------------------

const TEAMS = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams";
const TEAM = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams";

/** Wszystkie drużyny NBA (do strony przeglądania). */
export async function getTeams(): Promise<TeamInfo[]> {
  const data = await fetchJson(TEAMS);
  const list: any[] = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return list
    .map((t) => {
      const team = t?.team ?? {};
      return {
        id: String(team.id ?? ""),
        name: team.displayName ?? team.name ?? "—",
        shortName: team.shortDisplayName ?? team.name ?? "—",
        abbreviation: team.abbreviation ?? "",
        logo: team.logos?.[0]?.href ?? null,
        color: team.color ?? null,
      } as TeamInfo;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type TeamScheduleGame = {
  id: string;
  dateISO: string;
  completed: boolean;
  periods: number;
  opponent: TeamInfo;
  isHome: boolean;
  teamScore: number;
  oppScore: number;
  topPts: number;
};

/** Harmonogram drużyny w danym sezonie (rok zakończenia sezonu, np. 2025). */
export async function getTeamSchedule(
  teamId: string,
  season: number
): Promise<{ team: TeamInfo; games: TeamScheduleGame[] }> {
  const data = await fetchJson(`${TEAM}/${teamId}/schedule?season=${season}`);
  const teamRaw = data?.team ?? {};
  const team: TeamInfo = {
    id: String(teamRaw.id ?? teamId),
    name: teamRaw.displayName ?? teamRaw.name ?? "—",
    shortName: teamRaw.shortDisplayName ?? teamRaw.name ?? "—",
    abbreviation: teamRaw.abbreviation ?? "",
    // schedule zwraca logo jako string `team.logo`, nie tablicę `logos[]`
    logo: teamRaw.logo ?? teamRaw.logos?.[0]?.href ?? null,
    color: teamRaw.color ?? null,
  };

  const events: any[] = data?.events ?? [];
  const games: TeamScheduleGame[] = events
    .map((ev) => {
      const comp = ev?.competitions?.[0] ?? {};
      const competitors: any[] = comp?.competitors ?? [];
      const mine = competitors.find((c) => String(c?.team?.id) === String(teamId));
      const opp = competitors.find((c) => String(c?.team?.id) !== String(teamId));
      const status = comp?.status ?? {};
      return {
        id: String(ev.id),
        dateISO: espnDateToEtIso(ev.date ?? ""),
        completed: status?.type?.completed === true,
        periods: Number(status?.period ?? 4),
        opponent: parseTeam(opp),
        isHome: mine?.homeAway === "home",
        teamScore: toInt(mine?.score?.value ?? mine?.score),
        oppScore: toInt(opp?.score?.value ?? opp?.score),
        topPts: leadersTopPts(comp),
      };
    })
    .filter((g) => g.completed);

  return { team, games };
}

/** Znajduje indeks statystyki po etykiecie (ESPN bywa niespójny w kolejności). */
function statIndex(labels: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = labels.findIndex((l) => l?.toUpperCase() === c.toUpperCase());
    if (i !== -1) return i;
  }
  return -1;
}

function toInt(v: string | undefined): number {
  const n = parseInt(String(v ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
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

function parsePlayers(teamPlayers: any): PlayerLine[] {
  const stat = teamPlayers?.statistics?.[0] ?? {};
  const labels: string[] = stat?.labels ?? [];
  const athletes: any[] = stat?.athletes ?? [];

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

  return athletes
    .filter((a) => !a?.didNotPlay && Array.isArray(a?.stats) && a.stats.length)
    .map((a) => {
      const s: string[] = a.stats;
      const pts = toInt(s[iPts]);
      const reb = toInt(s[iReb]);
      const ast = toInt(s[iAst]);
      const stl = toInt(s[iStl]);
      const blk = toInt(s[iBlk]);
      const doubleDigitCats = [pts, reb, ast, stl, blk].filter((x) => x >= 10).length;
      return {
        name: a?.athlete?.displayName ?? "—",
        starter: a?.starter === true,
        min: toInt(s[iMin]),
        pts,
        reb,
        ast,
        stl,
        blk,
        fg: s[iFg] ?? "0-0",
        tp: s[iTp] ?? "0-0",
        ft: s[iFt] ?? "0-0",
        to: toInt(s[iTo]),
        doubleDigitCats,
      };
    });
}

export type GameSummary = {
  id: string;
  periods: number;
  seasonTypeName: string; // "Regular Season" | "Playoffs" | "Play-In" ...
  pbp: PbpPoint[];
  home: TeamBox;
  away: TeamBox;
};

/** Pełne dane meczu: box score + wynik + liczba kwart + play-by-play. */
export async function getGameSummary(gameId: string): Promise<GameSummary> {
  const data = await fetchJson(`${SUMMARY}?event=${gameId}`);

  const comp = data?.header?.competitions?.[0] ?? {};
  const competitors: any[] = comp?.competitors ?? [];

  // typ rozgrywek — kontekst (playoff > sezon zasadniczy). Bywa w kilku miejscach.
  const seasonTypeName: string =
    data?.header?.season?.type?.name ??
    data?.header?.competitions?.[0]?.type?.text ??
    data?.season?.type?.name ??
    "Regular Season";

  // play-by-play -> lekkie punkty {home, away, period, sec}
  const rawPlays: any[] = Array.isArray(data?.plays) ? data.plays : [];
  const pbp: PbpPoint[] = rawPlays
    .map((p) => ({
      home: toInt(p?.homeScore),
      away: toInt(p?.awayScore),
      period: Number(p?.period?.number ?? 0),
      sec: clockToSeconds(p?.clock?.displayValue),
    }))
    .filter((p) => p.period > 0);

  // Liczba kwart — w endpoincie summary status.period bywa undefined,
  // więc wnioskujemy w kolejności: 1) z linescores (po jednej na kwartę),
  // 2) z detalu statusu ("Final/OT", "Final/2OT"), 3) z period jeśli jest.
  const linescores: any[] = comp?.competitors?.[0]?.linescores ?? [];
  const detail: string =
    comp?.status?.type?.detail ?? comp?.status?.type?.shortDetail ?? "";
  const otMatch = detail.match(/(\d*)\s*OT/i);
  let periods = 4;
  if (Array.isArray(linescores) && linescores.length >= 4) {
    periods = linescores.length;
  } else if (otMatch) {
    periods = 4 + (otMatch[1] ? parseInt(otMatch[1], 10) : 1);
  } else if (Number(comp?.status?.period) >= 4) {
    periods = Number(comp?.status?.period);
  }

  const boxTeams: any[] = data?.boxscore?.players ?? [];

  const build = (homeAway: "home" | "away"): TeamBox => {
    const competitor =
      competitors.find((c) => c.homeAway === homeAway) ?? competitors[0] ?? {};
    const team = parseTeam(competitor);
    // dopasuj blok box score po id drużyny
    const bp =
      boxTeams.find((b) => String(b?.team?.id ?? "") === team.id) ??
      boxTeams[homeAway === "home" ? boxTeams.length - 1 : 0] ??
      {};
    return {
      team,
      homeAway,
      score: toInt(competitor?.score),
      players: parsePlayers(bp),
    };
  };

  return {
    id: gameId,
    periods,
    seasonTypeName,
    pbp,
    home: build("home"),
    away: build("away"),
  };
}
