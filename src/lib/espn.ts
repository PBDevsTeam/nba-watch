// Klient nieoficjalnego (hidden) ESPN API dla NBA.
// Bez klucza, bez auth. Dane meczów zakończonych są statyczne -> mocno cache'ujemy.

import type { PlayerLine, TeamBox, TeamInfo } from "./types";

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
};

/** Lista meczów danego dnia (YYYYMMDD). Tylko podstawowe info. */
export async function getScoreboard(yyyymmdd: string): Promise<ScoreboardGame[]> {
  const data = await fetchJson(`${SCOREBOARD}?dates=${yyyymmdd}`);
  const events: any[] = data?.events ?? [];
  return events.map((ev) => {
    const comp = ev?.competitions?.[0] ?? {};
    const competitors: any[] = comp?.competitors ?? [];
    const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
    const away = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
    const status = comp?.status ?? ev?.status ?? {};
    return {
      id: String(ev.id),
      dateISO: (ev.date ?? "").slice(0, 10),
      completed: status?.type?.completed === true,
      periods: Number(status?.period ?? 4),
      away: parseTeam(away),
      home: parseTeam(home),
    };
  });
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
  home: TeamBox;
  away: TeamBox;
};

/** Pełne dane meczu: box score + wynik + liczba kwart. */
export async function getGameSummary(gameId: string): Promise<GameSummary> {
  const data = await fetchJson(`${SUMMARY}?event=${gameId}`);

  const comp = data?.header?.competitions?.[0] ?? {};
  const competitors: any[] = comp?.competitors ?? [];
  const periods = Number(comp?.status?.period ?? 4);

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
    home: build("home"),
    away: build("away"),
  };
}
