// Narzędzia dat — operujemy na strefie US/Eastern, bo wg niej rozgrywane są mecze NBA.

const PL_MONTHS = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];
const PL_MONTHS_NOM = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];
const PL_WEEKDAYS = [
  "niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota",
];
/** Skróty dni — kolejność od poniedziałku (jak w polskim kalendarzu). */
export const PL_WEEKDAYS_SHORT_MON = ["pn", "wt", "śr", "cz", "pt", "sb", "nd"];

/** Aktualna data w strefie ET jako {y,m,d}. */
function nowET(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function isoFromDate(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Dzisiejsza data wg ET. */
export function todayISO(): string {
  const { y, m, d } = nowET();
  return isoFromDate(new Date(Date.UTC(y, m - 1, d)));
}

/** Domyślna data widoku: "wczoraj" wg ET (noc meczowa, która już się zakończyła). */
export function defaultDate(): string {
  const { y, m, d } = nowET();
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return isoFromDate(dt);
}

/** "2025-01-15" -> "20250115" dla ESPN. */
export function toEspnDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/**
 * Konwertuje znacznik czasu ESPN (UTC, np. "2025-02-04T03:00Z") na datę
 * w strefie ET ("2025-02-03"). KLUCZOWE: ESPN podaje czas meczu w UTC, ale
 * scoreboard indeksuje mecze wg daty ET (mecz wieczorem ET = następny dzień UTC).
 * Użycie samego .slice(0,10) na UTC dawało rozjazd dat o 1 dzień.
 */
export function espnDateToEtIso(espnDate: string): string {
  if (!espnDate) return "";
  const d = new Date(espnDate);
  if (isNaN(d.getTime())) return espnDate.slice(0, 10);
  // en-CA daje format YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Waliduje i normalizuje parametr daty; fallback do domyślnej. */
export function normalizeDate(input: string | undefined): string {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return defaultDate();
}

export function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return isoFromDate(dt);
}

/** Przesuwa o n miesięcy (zachowuje 1. dzień miesiąca — używane w kalendarzu). */
export function addMonths(iso: string, n: number): string {
  const [y, m] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  return isoFromDate(dt);
}

/** Liczba dni od `fromIso` do `toIso` (dodatnia, gdy toIso jest później). */
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(toIso) - ms(fromIso)) / 86_400_000);
}

// --- sezony -------------------------------------------------------------------
//
// Sezon NBA oznaczamy rokiem zakończenia (jak ESPN): 2027 = sezon 2026/27.
// Nowy sezon liczymy od 1 października; do tego czasu "bieżący" jest ten,
// który skończył się w czerwcu.

export function seasonForDate(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return m >= 10 ? y + 1 : y;
}

export function currentSeason(): number {
  return seasonForDate(todayISO());
}

/** 2027 -> "2026/27". */
export function seasonLabel(season: number): string {
  return `${season - 1}/${String(season).slice(2)}`;
}

/** Sezony do wyboru: bieżący i dwa poprzednie. */
export function selectableSeasons(): number[] {
  const s = currentSeason();
  return [s, s - 1, s - 2];
}

/** Waliduje parametr sezonu z URL; fallback do bieżącego. */
export function normalizeSeason(input: string | undefined): number {
  const n = Number(input);
  return selectableSeasons().includes(n) ? n : currentSeason();
}

// --- czas polski -----------------------------------------------------------------

const PL_TIME = new Intl.DateTimeFormat("pl-PL", {
  timeZone: "Europe/Warsaw",
  hour: "2-digit",
  minute: "2-digit",
});
const PL_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Warsaw",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data (YYYY-MM-DD) w Polsce dla znacznika czasu ISO. */
export function plDateOf(startISO: string): string {
  return PL_DATE.format(new Date(startISO));
}

/** Godzina rozpoczęcia w Polsce, np. "01:30". */
export function formatTimePl(startISO: string): string {
  return PL_TIME.format(new Date(startISO));
}

/**
 * Nagłówek dnia meczowego z perspektywy kibica w Polsce. Mecze z 16 listopada
 * (czasu USA) grane są zwykle w nocy z 16 na 17 listopada naszego czasu.
 * Gdy choć jeden mecz zaczyna się jeszcze 16. (weekendowe popołudnia w USA),
 * nie piszemy o nocy, tylko podajemy oba dni.
 */
export function nightTitle(iso: string, startISOs: string[]): string {
  const next = shiftDate(iso, 1);
  const [, m, d] = iso.split("-").map(Number);
  const [, m2, d2] = next.split("-").map(Number);
  const allNext = startISOs.length > 0 && startISOs.every((s) => plDateOf(s) === next);
  const sameMonth = m === m2;
  const range = sameMonth
    ? `${d} na ${d2} ${PL_MONTHS[m - 1]}`
    : `${d} ${PL_MONTHS[m - 1]} na ${d2} ${PL_MONTHS[m2 - 1]}`;
  if (allNext) return `Noc z ${range}`;
  return sameMonth
    ? `${d}–${d2} ${PL_MONTHS[m - 1]}`
    : `${d} ${PL_MONTHS[m - 1]} – ${d2} ${PL_MONTHS[m2 - 1]}`;
}

/** Skrót dnia tygodnia dla daty ISO, np. "pn". */
export function weekdayShortPl(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return PL_WEEKDAYS_SHORT_MON[(wd + 6) % 7];
}

/** Czy dana data jest w przyszłości względem "dziś" w ET. */
export function isFuture(iso: string): boolean {
  return iso > todayISO();
}

/** "2025-01-15" -> "środa, 15 stycznia 2025". */
export function formatPl(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = PL_WEEKDAYS[dt.getUTCDay()];
  return `${wd}, ${d} ${PL_MONTHS[m - 1]} ${y}`;
}

/** Krótki format do triggera: "15 sty 2025". */
export function formatShortPl(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${PL_MONTHS_NOM[m - 1].slice(0, 3)} ${y}`;
}

/** Nagłówek kalendarza: "styczeń 2025". */
export function formatMonthPl(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${PL_MONTHS_NOM[m - 1]} ${y}`;
}

/**
 * Siatka miesiąca (od poniedziałku). Zwraca tablicę komórek — ISO dnia lub null
 * dla wypełnień przed 1. i po ostatnim dniu miesiąca.
 */
export function monthGrid(iso: string): (string | null)[] {
  const [y, m] = iso.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  // getUTCDay: 0=niedziela; przeliczamy na 0=poniedziałek
  const lead = (first.getUTCDay() + 6) % 7;

  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(isoFromDate(new Date(Date.UTC(y, m - 1, d))));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
