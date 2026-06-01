import Link from "next/link";
import { DateNav } from "./DateNav";

/**
 * Wspólny topbar. Gdy podany `date`, pokazuje nawigację datą (strona główna).
 * `active` podświetla bieżącą sekcję.
 */
export function SiteHeader({
  date,
  active,
}: {
  date?: string;
  active?: "mecze" | "druzyny" | "ranking";
}) {
  const navItem = (href: string, label: string, key: string) =>
    `text-sm font-medium transition-colors ${
      active === key ? "text-accent" : "text-muted hover:text-text"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="w-[92%] max-w-[1600px] mx-auto h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid place-items-center h-9 w-9 bg-accent text-bg font-display font-black text-lg rounded-sm">
              N
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight hidden sm:block">
              NBA<span className="text-accent">WATCH</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-5">
            <Link href="/" className={navItem("/", "Mecze", "mecze")}>
              Mecze
            </Link>
            <Link href="/druzyny" className={navItem("/druzyny", "Drużyny", "druzyny")}>
              Drużyny
            </Link>
            <Link href="/ranking" className={navItem("/ranking", "Ranking", "ranking")}>
              Ranking
            </Link>
          </nav>
        </div>
        {date && <DateNav date={date} />}
      </div>
    </header>
  );
}
