"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  formatMonthPl,
  formatShortPl,
  isFuture,
  monthGrid,
  PL_WEEKDAYS_SHORT_MON,
  shiftDate,
  todayISO,
} from "@/lib/dates";

export function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => date);
  const wrapRef = useRef<HTMLDivElement>(null);

  function go(iso: string) {
    setOpen(false);
    startTransition(() => router.push(`/?date=${iso}`));
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) setView(date);
  }, [open, date]);

  // heatmapa: najlepszy wskaźnik per dzień w widocznym miesiącu
  const [heat, setHeat] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!open) return;
    const cells = monthGrid(view).filter(Boolean) as string[];
    if (!cells.length) return;
    const from = cells[0];
    const to = cells[cells.length - 1];
    let cancelled = false;
    fetch(`/api/heat?from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : { heat: {} }))
      .then((d) => {
        if (!cancelled) setHeat(d.heat ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, view]);

  const prev = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const nextDisabled = isFuture(next);
  const today = todayISO();
  const cells = monthGrid(view);
  const monthForwardDisabled = addMonths(view, 1) > today;

  // kolor kropki heat wg progów tierów
  function heatColor(score: number): string {
    if (score >= 85) return "var(--color-t-must)";
    if (score >= 70) return "var(--color-t-great)";
    if (score >= 55) return "var(--color-t-good)";
    if (score >= 40) return "var(--color-t-avg)";
    return "var(--color-t-skip)";
  }

  const btn =
    "h-9 w-9 grid place-items-center border border-border bg-surface text-muted hover:text-text hover:border-border-strong transition-colors rounded-sm";

  return (
    <div className="flex items-center gap-1.5" ref={wrapRef}>
      <button onClick={() => go(prev)} className={btn} aria-label="Poprzedni dzień">
        ‹
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`h-9 px-3 sm:min-w-[11rem] border border-border bg-surface hover:border-border-strong rounded-sm font-display font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
            pending ? "opacity-60" : ""
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-accent shrink-0">
            <rect x="3" y="4.5" width="18" height="16" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <path d="M3 9h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {formatShortPl(date)}
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Wybór daty"
            className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 z-50 w-[19rem] border border-border-strong bg-surface rounded-md shadow-2xl p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setView(addMonths(view, -1))}
                className="h-8 w-8 grid place-items-center rounded-sm hover:bg-surface-hover text-muted hover:text-text"
                aria-label="Poprzedni miesiąc"
              >
                ‹
              </button>
              <span className="font-display font-bold text-sm capitalize">
                {formatMonthPl(view)}
              </span>
              <button
                onClick={() => !monthForwardDisabled && setView(addMonths(view, 1))}
                disabled={monthForwardDisabled}
                className="h-8 w-8 grid place-items-center rounded-sm hover:bg-surface-hover text-muted hover:text-text disabled:opacity-25 disabled:hover:bg-transparent"
                aria-label="Następny miesiąc"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {PL_WEEKDAYS_SHORT_MON.map((d) => (
                <div
                  key={d}
                  className="h-7 grid place-items-center text-[11px] font-mono uppercase text-faint"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((iso, i) => {
                if (!iso) return <div key={`e${i}`} className="h-8" />;
                const disabled = isFuture(iso);
                const selected = iso === date;
                const isToday = iso === today;
                const dayNum = Number(iso.slice(8, 10));
                const dayHeat = heat[iso];
                return (
                  <button
                    key={iso}
                    onClick={() => !disabled && go(iso)}
                    disabled={disabled}
                    title={dayHeat ? `Najlepszy mecz: ${dayHeat}/100` : undefined}
                    className={[
                      "h-9 rounded-sm text-sm font-mono tabular-nums grid place-items-center transition-colors relative",
                      selected
                        ? "bg-accent text-bg font-bold"
                        : disabled
                        ? "text-faint/40 cursor-not-allowed"
                        : "text-text hover:bg-surface-hover",
                    ].join(" ")}
                  >
                    {dayNum}
                    {/* kropka heat: kolor wg najlepszego meczu dnia */}
                    {dayHeat !== undefined && !selected && (
                      <span
                        className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                        style={{ background: heatColor(dayHeat) }}
                      />
                    )}
                    {isToday && !selected && dayHeat === undefined && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-faint" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* legenda heat */}
            <div className="flex items-center justify-center gap-3 mt-2.5 pt-2.5 border-t border-border text-[10px] text-faint">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-t-must)" }} />
                hit
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-t-good)" }} />
                warto
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-t-skip)" }} />
                słabo
              </span>
            </div>

            <button
              onClick={() => go(today)}
              className="mt-2 w-full h-8 rounded-sm border border-border bg-surface hover:border-border-strong text-sm font-medium text-muted hover:text-text transition-colors"
            >
              Dziś
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => !nextDisabled && go(next)}
        disabled={nextDisabled}
        className={`${btn} disabled:opacity-25`}
        aria-label="Następny dzień"
      >
        ›
      </button>
    </div>
  );
}
