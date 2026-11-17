import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contextFor,
  contextShortLabel,
  parseGameNumber,
  parseRound,
  stakesFactor,
} from "./kontekst";

test("rundy play-off z notki ESPN", () => {
  assert.equal(parseRound("NBA Finals - Game 7"), "finals");
  assert.equal(parseRound("East Finals - Game 3"), "confFinals");
  assert.equal(parseRound("West Semifinals - Game 1"), "semis");
  assert.equal(parseRound("East 1st Round - Game 4"), "first");
  assert.equal(parseRound("NBA Play-In - East - 7th Place vs 8th Place"), null);
  assert.equal(parseRound(""), null);
  assert.equal(parseGameNumber("NBA Finals - Game 7"), 7);
  assert.equal(parseGameNumber("Regular season"), null);
});

test("typ sezonu jako liczba (tak jak podaje summary) daje właściwą rangę", () => {
  const finals = contextFor({ seasonType: 3, gameNote: "NBA Finals - Game 7", seriesBefore: null });
  assert.equal(finals.kind, "finals");
  assert.equal(finals.multiplier, 1.25);
  assert.equal(finals.gameNumber, 7);
  assert.equal(contextShortLabel(finals), "Finały NBA, mecz 7");

  const semis = contextFor({ seasonType: 3, gameNote: "East Semifinals - Game 1", seriesBefore: null });
  assert.equal(semis.kind, "playoffs");
  assert.equal(semis.label, "Półfinał konferencji");

  const playin = contextFor({
    seasonType: 5,
    gameNote: "NBA Play-In - East - 7th Place vs 8th Place",
    seriesBefore: null,
  });
  assert.equal(playin.kind, "playin");

  const regular = contextFor({ seasonType: 2, gameNote: "", seriesBefore: null });
  assert.equal(regular.kind, "regular");
  assert.equal(regular.multiplier, 1);
  assert.equal(contextShortLabel(regular), "");
});

test("stawka: mecz 7 > mecz o odpadnięcie > zwykły mecz serii", () => {
  const input = (gameNote: string, homeWins: number, awayWins: number) => ({
    seasonType: 3,
    gameNote,
    seriesBefore: { homeWins, awayWins },
  });
  const g7 = input("NBA Finals - Game 7", 3, 3);
  const g6 = input("NBA Finals - Game 6", 3, 2);
  const g2 = input("NBA Finals - Game 2", 1, 0);
  const s7 = stakesFactor(contextFor(g7), g7)!;
  const s6 = stakesFactor(contextFor(g6), g6)!;
  const s2 = stakesFactor(contextFor(g2), g2)!;
  assert.ok(s7.standalone > s6.standalone);
  assert.ok(s6.standalone > s2.standalone);
  assert.match(s6.detail, /odpadnięcie/);
  assert.equal(stakesFactor(contextFor({ seasonType: 2, gameNote: "", seriesBefore: null }), {
    seasonType: 2,
    gameNote: "",
    seriesBefore: null,
  }), null);
});

test("mecz 7 rozpoznany z samej notki, gdy brak danych serii", () => {
  const i = { seasonType: 3, gameNote: "West 1st Round - Game 7", seriesBefore: null };
  const s = stakesFactor(contextFor(i), i)!;
  assert.match(s.detail, /mecz 7/);
});
