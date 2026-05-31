"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
  const [view, setView] = useState(() => date); // miesiąc widoczny w kalendarzu
  const wrapRef = useRef<HTMLDivElement>(null);

  function go(iso: string) {
    setOpen(false);
    startTransition(() => router.push(`/?date=${iso}`));
  }

  // zamknięcie: klik poza / Escape
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

  // po otwarciu ustaw widok na miesiąc wybranej daty
  useEffect(() => {
    if (open) setView(date);
  }, [open, date]);

  const prev = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const nextDisabled = isFuture(next);
  const today = todayISO();
  const cells = monthGrid(view);
  // blokuj nawigację do miesięcy całkowicie w przyszłości
  const nextMonthFirst = addMonths(view, 1);
  const monthForwardDisabled = nextMonthFirst > today;

  return (
    <div className="flex items-center justify-center gap-2.5 flex-wrap">
      {/* poprzedni dzień */}
      <button
        onClick={() => go(prev)}
        className="h-11 w-11 rounded-xl glass-soft glass-hover text-muted hover:text-text flex items-center justify-center text-xl"
        aria-label="Poprzedni dzień"
      >
        ‹
      </button>

      {/* trigger + popover */}
      <div className="relative" ref={wrapRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`min-w-[15rem] h-11 px-5 rounded-xl glass-soft glass-hover font-display font-semibold flex items-center justify-center gap-2.5 ${
            pending ? "opacity-60" : ""
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="text-accent-soft">
            <rect x="3" y="4.5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 9h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {formatShortPl(date)}
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Wybór daty"
            className="absolute left-1/2 -translate-x-1/2 mt-3 z-50 w-[20rem] glass rounded-2xl p-4 animate-pop"
          >
            {/* nagłówek miesiąca */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setView(addMonths(view, -1))}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-muted hover:text-text flex items-center justify-center"
                aria-label="Poprzedni miesiąc"
              >
                ‹
              </button>
              <span className="font-display font-semibold capitalize">
                {formatMonthPl(view)}
              </span>
              <button
                onClick={() => !monthForwardDisabled && setView(addMonths(view, 1))}
                disabled={monthForwardDisabled}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-muted hover:text-text flex items-center justify-center disabled:opacity-25 disabled:hover:bg-transparent"
                aria-label="Następny miesiąc"
              >
                ›
              </button>
            </div>

            {/* dni tygodnia */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {PL_WEEKDAYS_SHORT_MON.map((d) => (
                <div
                  key={d}
                  className="h-7 flex items-center justify-center text-[11px] font-mono uppercase text-faint"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* siatka dni */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((iso, i) => {
                if (!iso) return <div key={`e${i}`} className="h-9" />;
                const disabled = isFuture(iso);
                const selected = iso === date;
                const isToday = iso === today;
                const dayNum = Number(iso.slice(8, 10));
                return (
                  <button
                    key={iso}
                    onClick={() => !disabled && go(iso)}
                    disabled={disabled}
                    className={[
                      "h-9 rounded-lg text-sm font-mono tabular-nums flex items-center justify-center transition-colors relative",
                      selected
                        ? "bg-accent text-[#06070d] font-bold"
                        : disabled
                        ? "text-faint/40 cursor-not-allowed"
                        : "text-text hover:bg-white/10",
                    ].join(" ")}
                  >
                    {dayNum}
                    {isToday && !selected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent-soft" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => go(today)}
              className="mt-3 w-full h-9 rounded-lg glass-soft glass-hover text-sm font-medium text-muted hover:text-text"
            >
              Dziś
            </button>
          </div>
        )}
      </div>

      {/* następny dzień */}
      <button
        onClick={() => !nextDisabled && go(next)}
        disabled={nextDisabled}
        className="h-11 w-11 rounded-xl glass-soft glass-hover text-muted hover:text-text flex items-center justify-center text-xl disabled:opacity-25"
        aria-label="Następny dzień"
      >
        ›
      </button>
    </div>
  );
}
