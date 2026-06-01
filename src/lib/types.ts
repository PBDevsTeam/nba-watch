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

/** Kontekst rozgrywek — mnożnik ważności meczu (playoff > sezon zasadniczy). */
export type WatchContext = {
  kind: "regular" | "playin" | "playoffs" | "finals";
  label: string; // "Sezon zasadniczy" | "Play-In" | "Playoff" | "Finały"
  multiplier: number; // 1.0 ... 1.25
};

/** Lekki obiekt wysyłany PRZED revealem — nie zdradza wyniku. */
export type GamePreview = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  away: TeamInfo;
  home: TeamInfo;
  watchScore: number; // 0-100
  tier: WatchTier;
  context: WatchContext;
};

/** Punkt wykresu przebiegu: różnica (home - away) w danym momencie meczu. */
export type FlowPoint = {
  t: number; // 0..1 — postęp meczu
  diff: number; // home - away (dodatnie = prowadzi gospodarz)
  period: number;
};

/** Pełny obiekt po revealu — zawiera wynik i box score (spoilery). */
export type GameReveal = {
  id: string;
  away: TeamBox;
  home: TeamBox;
  periods: number; // 4 = bez dogrywki, >4 = dogrywka(i)
  watchScore: number;
  tier: WatchTier;
  context: WatchContext;
  base: number; // wynik przed mnożnikiem kontekstu
  breakdown: WatchFactor[]; // posortowane malejąco wg standalone
  flow: FlowPoint[]; // przebieg różnicy punktowej (z play-by-play)
};

export type WatchTier = {
  key: "must" | "great" | "good" | "average" | "skip";
  label: string;
  emoji: string;
  color: string; // hex
};

/**
 * Pojedynczy "powód, aby obejrzeć". `standalone` (0-100) = ile ten powód byłby
 * wart, gdyby był JEDYNĄ rzeczą w meczu. Model bierze najsilniejszy jako bazę,
 * reszta dopełnia — dlatego pojedynczy wybitny wyczyn czyni mecz must-watch.
 */
export type WatchFactor = {
  key: string;
  label: string; // np. "Eksplozja punktowa"
  detail: string; // np. "Bam Adebayo — 83 pkt"
  standalone: number; // 0-100
  primary?: boolean; // czy to główny powód (najwyższy standalone)
};
