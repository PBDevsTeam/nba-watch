// Ranga meczu (sezon zasadniczy / play-in / play-off / finały) i stawka meczu.
//
// ESPN w endpoincie `summary` podaje typ sezonu jako LICZBĘ w
// `header.season.type` (2 = sezon zasadniczy, 3 = play-off, 5 = play-in),
// a rundę i numer meczu tylko w notce `header.gameNote`, np.
// "NBA Finals - Game 7", "East Semifinals - Game 1", "West 1st Round - Game 4",
// "NBA Play-In - East - 7th Place vs 8th Place".
//
// Moduł jest czysty (tylko importy typów), żeby testy szły na gołym Node.

import type { PlayoffRound, WatchContext, WatchFactor } from "./types";

export const SEASON_TYPE = {
  preseason: 1,
  regular: 2,
  postseason: 3,
  offseason: 4,
  playin: 5,
} as const;

/** Stan serii PRZED meczem: liczba wygranych każdej drużyny. */
export type SeriesBefore = { homeWins: number; awayWins: number };

export type ContextInput = {
  seasonType: number | null;
  gameNote: string;
  seriesBefore: SeriesBefore | null;
};

const ROUND_LABEL: Record<PlayoffRound, string> = {
  first: "Pierwsza runda",
  semis: "Półfinał konferencji",
  confFinals: "Finał konferencji",
  finals: "Finały NBA",
};

const ROUND_MULTIPLIER: Record<PlayoffRound, number> = {
  first: 1.12,
  semis: 1.15,
  confFinals: 1.2,
  finals: 1.25,
};

export function parseRound(note: string): PlayoffRound | null {
  const n = note.toLowerCase();
  if (n.includes("nba finals")) return "finals";
  if (/\b(east|west)(ern)?( conference)? finals\b/.test(n)) return "confFinals";
  if (n.includes("semifinal")) return "semis";
  if (n.includes("1st round") || n.includes("first round")) return "first";
  return null;
}

export function parseGameNumber(note: string): number | null {
  const m = /\bgame\s+(\d)\b/i.exec(note);
  return m ? Number(m[1]) : null;
}

/** Ranga meczu. Wszystko tu jest wiedzą sprzed meczu, więc może być pokazane przed odkryciem. */
export function contextFor(input: ContextInput): WatchContext {
  const note = input.gameNote ?? "";
  const lower = note.toLowerCase();
  const isPlayIn = input.seasonType === SEASON_TYPE.playin || lower.includes("play-in");
  const round = parseRound(note);
  const isPost = input.seasonType === SEASON_TYPE.postseason || round !== null;

  if (isPlayIn) {
    return { kind: "playin", label: "Play-In", multiplier: 1.08 };
  }
  if (isPost) {
    const r = round ?? "first";
    const gameNumber = parseGameNumber(note) ?? undefined;
    return {
      kind: r === "finals" ? "finals" : "playoffs",
      label: round ? ROUND_LABEL[r] : "Play-off",
      multiplier: ROUND_MULTIPLIER[r],
      round: r,
      gameNumber,
    };
  }
  return { kind: "regular", label: "Sezon zasadniczy", multiplier: 1.0 };
}

/** Krótki opis rangi na kartę meczu, np. "Finały NBA, mecz 7". */
export function contextShortLabel(ctx: WatchContext): string {
  if (ctx.kind === "regular") return "";
  return ctx.gameNumber ? `${ctx.label}, mecz ${ctx.gameNumber}` : ctx.label;
}

/**
 * Stawka meczu jako osobny "powód, aby obejrzeć". Mecz 7 albo mecz, po którym
 * ktoś odpada, jest wart obejrzenia nawet bez dramatycznej końcówki. Sam mnożnik
 * rangi (×1.25) tego nie oddawał: mecz 7 Finałów 2025 dostawał 32/100.
 *
 * Opis (`detail`) może mówić o odpadnięciu, bo powody są pokazywane dopiero po
 * odkryciu wyniku.
 */
export function stakesFactor(
  ctx: WatchContext,
  input: ContextInput
): WatchFactor | null {
  if (ctx.kind === "regular") return null;

  if (ctx.kind === "playin") {
    const firstChance = /7th place vs 8th place/i.test(input.gameNote);
    return {
      key: "stakes",
      label: "Stawka meczu",
      detail: firstChance
        ? "Play-In: zwycięzca awansuje do play-off"
        : "Play-In: przegrany kończy sezon",
      standalone: firstChance ? 34 : 42,
    };
  }

  const round = ctx.round ?? "first";
  const game = ctx.gameNumber ?? 0;
  const s = input.seriesBefore;
  const elimination = s !== null && (s.homeWins === 3 || s.awayWins === 3);
  const game7 = game === 7 || (s !== null && s.homeWins === 3 && s.awayWins === 3);

  const table: Record<PlayoffRound, { g7: number; elim: number; base: number }> = {
    finals: { g7: 72, elim: 58, base: 45 },
    confFinals: { g7: 66, elim: 50, base: 30 },
    semis: { g7: 62, elim: 44, base: 22 },
    first: { g7: 58, elim: 40, base: 15 },
  };
  const t = table[round];

  if (game7) {
    return {
      key: "stakes",
      label: "Stawka meczu",
      detail: `${ROUND_LABEL[round]}: mecz 7, zwycięzca bierze serię`,
      standalone: t.g7,
    };
  }
  if (elimination) {
    return {
      key: "stakes",
      label: "Stawka meczu",
      detail: `${ROUND_LABEL[round]}: mecz o odpadnięcie`,
      standalone: t.elim,
    };
  }
  return {
    key: "stakes",
    label: "Stawka meczu",
    detail: game ? `${ROUND_LABEL[round]}, mecz ${game}` : ROUND_LABEL[round],
    standalone: t.base,
  };
}
