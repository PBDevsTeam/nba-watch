"use client";

// Pasek dni: dwa tygodnie wokół wybranego dnia. Pod każdym dniem kreska
// w kolorze najlepszego meczu tej nocy, więc od razu widać, która noc była gorąca.
// Kalendarz miesięczny: na telefonie wysuwany od dołu, na desktopie jako dymek.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  addMonths,
  formatMonthPl,
  monthGrid,
  PL_WEEKDAYS_SHORT_MON,
  shiftDate,
  weekdayShortPl,
} from "@/lib/dates";
import { tierForScore } from "@/lib/watchability";
import { tierVar } from "./ui";

function useHeat(from: string, to: string, enabled = true) {
  const [heat, setHeat] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!enabled || from > to) return;
    let cancelled = false;
    fetch(`/api/heat?from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : { heat: {} }))
      .then((d: { heat?: Record<string, number> }) => {
        if (!cancelled) setHeat((prev) => ({ ...prev, ...(d.heat ?? {}) }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [from, to, enabled]);
  return heat;
}

const heatColor = (score: number | undefined) =>
  score === undefined ? "transparent" : tierVar(tierForScore(score).key);

const dayHref = (iso: string) => `/?date=${iso}`;

// Desktop (>= lg): kalendarz jako dymek przy przycisku. Telefon: arkusz od dołu,
// renderowany w <body>, bo przyklejony pasek dni ma backdrop-filter, a ten
// zamyka elementy `position: fixed` w swoim prostokącie.
const DESKTOP = "(min-width: 1024px)";
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true
  );
}

export function DateStrip({ date, today }: { date: string; today: string }) {
  // Okno dwóch tygodni wokół wybranego dnia, ale nie dalej niż do dziś
  // (przyszłe dni nie mają jeszcze ocen, więc tylko zabierałyby miejsce).
  const days = useMemo(() => {
    const plusWeek = shiftDate(date, 7);
    const end = plusWeek < today ? plusWeek : today;
    return Array.from({ length: 15 }, (_, i) => shiftDate(end, i - 14));
  }, [date, today]);
  const lastPast = days[days.length - 1] < today ? days[days.length - 1] : today;
  const heat = useHeat(days[0], lastPast);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const scroller = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>("[aria-current='date']");
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [date]);

  const prev = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const arrow =
    "hidden sm:grid h-14 w-9 shrink-0 place-items-center rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors";

  return (
    <div className="relative flex items-center gap-1 sm:gap-2">
      <Link href={dayHref(prev)} className={arrow} aria-label="Poprzedni dzień">
        <ChevronLeft size={20} />
      </Link>

      <ol
        ref={scroller}
        className="flex-1 flex gap-1 overflow-x-auto no-scrollbar snap-x scroll-px-4 -mx-4 px-4 sm:mx-0 sm:px-0"
        aria-label="Wybór dnia"
      >
        {days.map((iso) => {
          const future = iso > today;
          const selected = iso === date;
          const score = heat[iso];
          const body = (
            <>
              <span className={`text-[11px] font-medium ${selected ? "text-bg/70" : "text-faint"}`}>
                {weekdayShortPl(iso)}
              </span>
              <span className="font-display text-[22px] font-extrabold leading-none tabular-nums">
                {Number(iso.slice(8))}
              </span>
              <span
                className="h-[3px] w-6 rounded-full"
                style={{ background: selected && score === undefined ? "transparent" : heatColor(score) }}
                aria-hidden
              />
            </>
          );
          const cls = `snap-center w-full flex flex-col items-center justify-center gap-1 h-16 rounded-xl transition-colors ${
            selected
              ? "bg-text text-bg"
              : future
              ? "text-faint/50 cursor-default"
              : "text-text hover:bg-surface-2"
          }`;
          return (
            <li key={iso} className="w-12 shrink-0 sm:w-auto sm:shrink sm:flex-1 sm:min-w-11 flex">
              {future ? (
                <span className={cls} aria-disabled>
                  {body}
                </span>
              ) : (
                <Link
                  href={dayHref(iso)}
                  className={cls}
                  aria-current={selected ? "date" : undefined}
                  title={score !== undefined ? `Najlepszy mecz tej nocy: ${score}/100` : undefined}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {next <= today ? (
        <Link href={dayHref(next)} className={arrow} aria-label="Następny dzień">
          <ChevronRight size={20} />
        </Link>
      ) : (
        <span className={`${arrow} opacity-30 pointer-events-none`} aria-hidden>
          <ChevronRight size={20} />
        </span>
      )}

      <button
        type="button"
        onClick={() => setCalendarOpen(true)}
        className="h-14 w-12 sm:w-auto sm:px-4 shrink-0 grid sm:flex place-items-center items-center gap-2 rounded-xl bg-surface-2 hover:bg-surface-hover text-sm font-medium transition-colors"
        aria-haspopup="dialog"
        aria-expanded={calendarOpen}
      >
        <CalendarDays size={20} aria-hidden />
        <span className="hidden sm:inline">Kalendarz</span>
      </button>

      {calendarOpen && (
        <Calendar date={date} today={today} onClose={() => setCalendarOpen(false)} />
      )}
    </div>
  );
}

function Calendar({
  date,
  today,
  onClose,
}: {
  date: string;
  today: string;
  onClose: () => void;
}) {
  const [view, setView] = useState(`${date.slice(0, 7)}-01`);
  const cells = monthGrid(view);
  const real = cells.filter((c): c is string => c !== null);
  const heat = useHeat(real[0], real[real.length - 1] < today ? real[real.length - 1] : today);
  const forwardDisabled = addMonths(view, 1) > today;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isDesktop = useIsDesktop();

  const panel = (
    <>
      <div
        className={`fixed inset-0 z-50 ${isDesktop ? "" : "bg-black/55"}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Kalendarz meczów"
        className={`z-50 bg-surface border border-line-strong shadow-[0_24px_64px_-12px_rgb(0_0_0/0.6)] p-4 outline-none ${
          isDesktop
            ? "absolute right-0 top-full mt-2 w-[23rem] rounded-2xl animate-reveal"
            : "fixed inset-x-0 bottom-0 rounded-t-3xl animate-sheet pb-[calc(1rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong lg:hidden" aria-hidden />
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setView(addMonths(view, -1))}
            className="h-10 w-10 grid place-items-center rounded-lg hover:bg-surface-hover text-muted hover:text-text"
            aria-label="Poprzedni miesiąc"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-display text-xl font-extrabold capitalize">{formatMonthPl(view)}</span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => !forwardDisabled && setView(addMonths(view, 1))}
              disabled={forwardDisabled}
              className="h-10 w-10 grid place-items-center rounded-lg hover:bg-surface-hover text-muted hover:text-text disabled:opacity-25 disabled:hover:bg-transparent"
              aria-label="Następny miesiąc"
            >
              <ChevronRight size={20} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 grid place-items-center rounded-lg hover:bg-surface-hover text-muted hover:text-text lg:hidden"
              aria-label="Zamknij kalendarz"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {PL_WEEKDAYS_SHORT_MON.map((d) => (
            <div key={d} className="h-7 grid place-items-center text-xs text-faint">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((iso, i) => {
            if (!iso) return <div key={`p${i}`} className="h-11" />;
            const future = iso > today;
            const selected = iso === date;
            const score = heat[iso];
            const cls = `h-11 rounded-lg grid place-items-center relative text-[15px] tabular-nums transition-colors ${
              selected ? "bg-text text-bg font-bold" : future ? "text-faint/40" : "hover:bg-surface-hover"
            }`;
            const inner = (
              <>
                {Number(iso.slice(8))}
                {score !== undefined && !selected && (
                  <span
                    className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: heatColor(score) }}
                    aria-hidden
                  />
                )}
              </>
            );
            return future ? (
              <span key={iso} className={cls}>
                {inner}
              </span>
            ) : (
              <Link
                key={iso}
                href={dayHref(iso)}
                onClick={onClose}
                className={cls}
                title={score !== undefined ? `Najlepszy mecz: ${score}/100` : undefined}
              >
                {inner}
              </Link>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-faint">
          Kropka ma kolor najlepszego meczu tej nocy. Brak kropki: nie było meczów.
        </p>
      </div>
    </>
  );

  return isDesktop ? panel : createPortal(panel, document.body);
}
