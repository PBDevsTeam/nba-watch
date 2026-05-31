// Narzędzia dat — operujemy na strefie US/Eastern, bo wg niej rozgrywane są mecze NBA.

const PL_MONTHS = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];
const PL_WEEKDAYS = [
  "niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota",
];

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

/** Domyślna data widoku: "wczoraj" wg ET (noc meczowa, która już się zakończyła). */
export function defaultDate(): string {
  const { y, m, d } = nowET();
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return isoFromDate(dt);
}

function isoFromDate(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

/** Czy dana data jest w przyszłości względem "dziś" w ET. */
export function isFuture(iso: string): boolean {
  const { y, m, d } = nowET();
  const today = isoFromDate(new Date(Date.UTC(y, m - 1, d)));
  return iso >= today;
}

/** "2025-01-15" -> "środa, 15 stycznia 2025". */
export function formatPl(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = PL_WEEKDAYS[dt.getUTCDay()];
  return `${wd}, ${d} ${PL_MONTHS[m - 1]} ${y}`;
}
