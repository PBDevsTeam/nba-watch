"use client";

// Wiersz meczu na liście dnia. Przed kliknięciem: ocena, drużyny, ranga, godzina.
// Wynik i statystyki dociągamy z /api/game/[id] dopiero na wyraźne żądanie.

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import type { GamePreview, GameReveal, TeamInfo } from "@/lib/types";
import { formatTimePl, plDateOf, weekdayShortPl } from "@/lib/dates";
import { ContextChip, ScoreBlock, TeamLogo, TierText } from "./ui";
import { GameDetail } from "./GameDetail";

function TeamLine({ team }: { team: TeamInfo }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <TeamLogo team={team} size={28} />
      <span className="font-display text-[22px] font-extrabold leading-none w-14 shrink-0">
        {team.abbreviation}
      </span>
      <span className="text-[15px] text-muted truncate">{team.shortName}</span>
    </div>
  );
}

function StartTime({ startISO }: { startISO: string | null }) {
  if (!startISO) return null;
  // Zawsze z dniem tygodnia: większość meczów zaczyna się po północy naszego czasu.
  return (
    <span className="text-sm text-faint whitespace-nowrap" title="Godzina rozpoczęcia, czas polski">
      {weekdayShortPl(plDateOf(startISO))} {formatTimePl(startISO)}
    </span>
  );
}

function StatusNote({ preview }: { preview: GamePreview }) {
  if (preview.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
        <span className="h-2 w-2 rounded-full bg-live animate-pulse-dot" aria-hidden />
        Trwa
      </span>
    );
  }
  if (preview.status === "scheduled") return <span className="text-sm text-muted">Przed meczem</span>;
  if (preview.status === "postponed") return <span className="text-sm text-muted">Przełożony</span>;
  if (!preview.tier) return <span className="text-sm text-muted">Ocena się liczy</span>;
  return <TierText tier={preview.tier} className="text-[15px]" />;
}

export function GameRow({ preview }: { preview: GamePreview }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GameReveal | null>(null);
  const [highlight, setHighlight] = useState(false);
  const rowRef = useRef<HTMLElement>(null);
  const revealable = preview.status === "final";
  const panelId = `wynik-${preview.id}`;

  // Link z rankingu/drużyny (/?date=…#mecz-123): lista jest strumieniowana, więc
  // przeglądarka nie znajdzie elementu przy ładowaniu. Przewijamy sami.
  useEffect(() => {
    if (window.location.hash !== `#mecz-${preview.id}`) return;
    rowRef.current?.scrollIntoView({ block: "center" });
    const on = setTimeout(() => setHighlight(true), 0);
    const off = setTimeout(() => setHighlight(false), 2400);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [preview.id]);

  async function toggle() {
    if (!revealable) return;
    if (data) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/game/${preview.id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Nie udało się pobrać wyniku");
      setData(body as GameReveal);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się pobrać wyniku");
    } finally {
      setLoading(false);
    }
  }

  const meta = (
    <>
      <StatusNote preview={preview} />
      <ContextChip context={preview.context} />
      <StartTime startISO={preview.startISO} />
    </>
  );

  return (
    <article
      ref={rowRef}
      id={`mecz-${preview.id}`}
      className={`game-row transition-colors duration-700 ${highlight ? "bg-surface-hover" : ""}`}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={!revealable}
        aria-expanded={revealable ? open : undefined}
        aria-controls={revealable ? panelId : undefined}
        className="w-full text-left grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-4 sm:gap-x-6 px-4 sm:px-5 py-4 enabled:hover:bg-surface-hover enabled:cursor-pointer transition-colors rounded-[inherit]"
      >
        <ScoreBlock score={preview.watchScore} tier={preview.tier} size="md" />

        <div className="min-w-0 space-y-2">
          <TeamLine team={preview.away} />
          <TeamLine team={preview.home} />
          <div className="flex sm:hidden flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">{meta}</div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-1.5">{meta}</div>

        <span className="flex items-center gap-2 text-muted">
          {revealable && (
            <span className="hidden md:inline text-sm font-medium">
              {error ? "Spróbuj ponownie" : open ? "Ukryj wynik" : "Pokaż wynik"}
            </span>
          )}
          {loading ? (
            <Loader2 size={20} className="animate-spin" aria-label="Wczytywanie" />
          ) : revealable ? (
            <ChevronDown
              size={20}
              aria-hidden
              className="transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
            />
          ) : (
            <span className="w-5" />
          )}
        </span>
      </button>

      {error && (
        <p className="px-4 sm:px-5 pb-3 -mt-1 text-sm text-t-must" role="alert">
          {error}
        </p>
      )}

      {data && open && (
        <div id={panelId} className="px-4 sm:px-5 pb-5 pt-1">
          <GameDetail data={data} />
        </div>
      )}
    </article>
  );
}
