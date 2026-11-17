import { test } from "node:test";
import assert from "node:assert/strict";
import { daysBetween, espnDateToEtIso, nightTitle, seasonForDate, seasonLabel } from "./dates";

test("sezon liczony z daty (rok zakończenia, od 1 października)", () => {
  assert.equal(seasonForDate("2026-11-17"), 2027);
  assert.equal(seasonForDate("2026-10-01"), 2027);
  assert.equal(seasonForDate("2026-09-30"), 2026);
  assert.equal(seasonForDate("2027-06-15"), 2027);
  assert.equal(seasonLabel(2027), "2026/27");
});

test("różnica dni", () => {
  assert.equal(daysBetween("2026-11-01", "2026-11-16"), 15);
  assert.equal(daysBetween("2026-11-16", "2026-11-01"), -15);
  assert.equal(daysBetween("2026-02-28", "2026-03-01"), 1);
});

test("czas ESPN (UTC) na datę meczu wg ET", () => {
  // 19:30 ET 3 lutego = 00:30 UTC 4 lutego
  assert.equal(espnDateToEtIso("2025-02-04T00:30Z"), "2025-02-03");
});

test("nagłówek nocy meczowej z perspektywy Polski", () => {
  // mecze 16.11 (ET) o 01:00 i 04:00 czasu polskiego 17.11
  assert.equal(
    nightTitle("2026-11-16", ["2026-11-17T00:00Z", "2026-11-17T03:00Z"]),
    "Noc z 16 na 17 listopada"
  );
  // weekendowy mecz o 21:30 czasu polskiego tego samego dnia
  assert.equal(
    nightTitle("2026-11-15", ["2026-11-15T20:30Z", "2026-11-16T01:00Z"]),
    "15–16 listopada"
  );
  assert.equal(
    nightTitle("2026-11-30", ["2026-12-01T01:00Z"]),
    "Noc z 30 listopada na 1 grudnia"
  );
});
