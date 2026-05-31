// Współdzielone typy domenowe dla aplikacji NBA Watch.

export type TeamInfo = {
  id: string;
  name: string; // pełna nazwa, np. "New York Knicks"
  shortName: string; // np. "Knicks"
  abbreviation: string; // np. "NY"
  logo: string | null;
  color: string | null; // hex bez #, z ESPN
};

export type PlayerLine = {
  name: string;
  starter: boolean;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg: string; // "10-18"
  tp: string; // "3-7" (trójki)
  ft: string; // "5-6"
  to: number;
  /** Liczba kategorii (z PTS/REB/AST/STL/BLK) w których zawodnik osiągnął >=10 */
  doubleDigitCats: number;
};

export type TeamBox = {
  team: TeamInfo;
  homeAway: "home" | "away";
  score: number;
  players: PlayerLine[];
};

/** Lekki obiekt wysyłany PRZED revealem — nie zdradza wyniku. */
export type GamePreview = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  away: TeamInfo;
  home: TeamInfo;
  watchScore: number; // 0-100
  tier: WatchTier;
};

/** Pełny obiekt po revealu — zawiera wynik i box score (spoilery). */
export type GameReveal = {
  id: string;
  away: TeamBox;
  home: TeamBox;
  periods: number; // 4 = bez dogrywki, >4 = dogrywka(i)
  watchScore: number;
  tier: WatchTier;
  breakdown: WatchFactor[];
};

export type WatchTier = {
  key: "must" | "great" | "good" | "average" | "skip";
  label: string;
  emoji: string;
  color: string; // hex
};

export type WatchFactor = {
  key: string;
  label: string; // np. "Końcówka na styku"
  detail: string; // np. "Różnica 2 pkt"
  points: number; // wkład w wynik
  max: number;
};
