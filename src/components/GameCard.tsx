"use client";

import { useState } from "react";
import type { GamePreview, GameReveal } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";
import { BoxScoreTable } from "./BoxScoreTable";
import { BreakdownList } from "./BreakdownList";

function TeamRow({
  logo,
  abbr,
  name,
}: {
  logo: string | null;
  abbr: string;
  name: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-9 w-9 sm:h-11 sm:w-11 shrink-0" />
      ) : (
        <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white/10 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="font-display text-lg sm:text-xl font-bold leading-none tracking-wide">
          {abbr}
        </div>
        <div className="text-xs text-faint truncate mt-1">{name}</div>
      </div>
    </div>
  );
}

export function GameCard({ preview }: { preview: GamePreview }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<GameReveal | null>(null);

  async function handleClick() {
    if (data) {
      setOpen((o) => !o);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/game/${preview.id}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
      setOpen(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const ot = data && data.periods > 4 ? data.periods - 4 : 0;
  const awayWon = data ? data.away.score > data.home.score : false;

  return (
    <article className="glass glass-hover rounded-[var(--radius-card)] overflow-hidden">
      {/* pasek nagłówka — cały klikalny */}
      <button
        onClick={handleClick}
        aria-expanded={open}
        className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 px-5 sm:px-7 py-5 cursor-pointer"
      >
        {/* matchup */}
        <div className="flex-1 flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="space-y-3 min-w-0 flex-1">
            <TeamRow
              logo={preview.away.logo}
              abbr={preview.away.abbreviation}
              name={preview.away.shortName}
            />
            <TeamRow
              logo={preview.home.logo}
              abbr={preview.home.abbreviation}
              name={preview.home.shortName}
            />
          </div>
          <span className="hidden md:inline-block text-[11px] font-mono uppercase tracking-[0.2em] text-faint rotate-0">
            @
          </span>
        </div>

        {/* prawy klaster: tier + gauge + akcja */}
        <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-6">
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap"
              style={{
                color: preview.tier.color,
                borderColor: `${preview.tier.color}40`,
                background: `${preview.tier.color}14`,
              }}
            >
              {preview.tier.emoji} {preview.tier.label}
            </span>
            <span className="text-xs text-faint hidden sm:block">
              {error
                ? "Błąd — kliknij ponownie"
                : data
                ? open
                  ? "Kliknij, aby zwinąć"
                  : "Kliknij, aby rozwinąć"
                : "Nie zdradza kto wygrał"}
            </span>
          </div>

          <ScoreGauge
            score={preview.watchScore}
            tier={preview.tier}
            size={92}
          />

          <div className="shrink-0 h-10 w-10 rounded-full glass-soft flex items-center justify-center text-muted">
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-accent animate-spin-slow" />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform duration-500"
                style={{ transform: open ? "rotate(180deg)" : "none" }}
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      </button>

      {/* sekcja rozwijana */}
      <div className="reveal-grid" data-open={open}>
        <div>
          {data && (
            <div className="px-5 sm:px-7 pb-7 pt-1 space-y-4 animate-fade-up">
              {/* wynik */}
              <div className="glass-soft rounded-2xl px-5 py-4 flex items-center justify-center gap-5">
                <span
                  className={`font-display text-lg font-bold ${
                    awayWon ? "text-text" : "text-muted"
                  }`}
                >
                  {data.away.team.shortName}
                </span>
                <span className="font-display text-3xl font-extrabold tabular-nums">
                  <span className={awayWon ? "text-accent-soft" : "text-muted"}>
                    {data.away.score}
                  </span>
                  <span className="text-faint mx-2">:</span>
                  <span className={!awayWon ? "text-accent-soft" : "text-muted"}>
                    {data.home.score}
                  </span>
                </span>
                <span
                  className={`font-display text-lg font-bold ${
                    !awayWon ? "text-text" : "text-muted"
                  }`}
                >
                  {data.home.team.shortName}
                </span>
                {ot > 0 && (
                  <span className="ml-2 text-[11px] font-mono font-bold tracking-wider px-2 py-1 rounded-full bg-accent/20 text-accent-soft">
                    {ot === 1 ? "OT" : `${ot}OT`}
                  </span>
                )}
              </div>

              <BoxScoreTable away={data.away} home={data.home} />
              <BreakdownList breakdown={data.breakdown} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
