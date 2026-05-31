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
