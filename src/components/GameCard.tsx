"use client";

import { useState } from "react";
import type { GamePreview, GameReveal, TeamInfo } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";
import { BoxScoreTable } from "./BoxScoreTable";
import { BreakdownList } from "./BreakdownList";
import { ScoreFlow } from "./ScoreFlow";

function TeamLine({ team }: { team: TeamInfo }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {team.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo} alt="" className="h-7 w-7 shrink-0" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-surface-2 shrink-0" />
      )}
      <span className="font-display font-bold text-base tracking-wide shrink-0 w-11">
        {team.abbreviation}
      </span>
      <span className="text-sm text-muted truncate hidden md:block">
        {team.shortName}
      </span>
    </div>
  );
}

export function GameCard({
  preview,
  rank,
}: {
  preview: GamePreview;
  rank: number;
}) {
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
    <div className="bg-surface">
      {/* wiersz meczu */}
      <button
        onClick={handleClick}
        aria-expanded={open}
        className="w-full text-left flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-4 hover:bg-surface-hover transition-colors cursor-pointer"
      >
        {/* rank */}
        <span className="font-mono text-xs text-faint w-5 text-center shrink-0 tabular-nums hidden sm:block">
          {rank}
        </span>

        {/* wskaźnik */}
        <ScoreGauge score={preview.watchScore} tier={preview.tier} size={56} />

        {/* matchup */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <TeamLine team={preview.away} />
          <TeamLine team={preview.home} />
        </div>

        {/* tier + kontekst */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {preview.context.kind !== "regular" && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-accent/15 text-accent-soft">
              {preview.context.label}
            </span>
          )}
          <span
            className="text-xs sm:text-sm font-semibold whitespace-nowrap"
            style={{ color: preview.tier.color }}
          >
            {preview.tier.label}
          </span>
          <span className="text-[11px] text-faint hidden sm:block">
            {error ? "błąd — kliknij ponownie" : "nie zdradza wyniku"}
          </span>
        </div>

        {/* chevron */}
        <span className="shrink-0 text-faint grid place-items-center w-6">
          {loading ? (
            <span className="h-4 w-4 rounded-full border-2 border-border-strong border-t-accent animate-spin-slow" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </button>

      {/* rozwijane szczegóły */}
      <div className="reveal-grid" data-open={open}>
        <div>
          {data && (
            <div className="border-t border-border bg-surface-2 px-3 sm:px-4 py-4 space-y-4">
              {/* wynik */}
              <div className="flex items-center justify-center gap-4 py-1">
                <span
                  className={`font-display text-base font-bold ${
                    awayWon ? "text-text" : "text-muted"
                  }`}
                >
                  {data.away.team.shortName}
                </span>
                <span className="font-display text-3xl font-black tabular-nums">
                  <span className={awayWon ? "text-accent" : "text-muted"}>
                    {data.away.score}
                  </span>
                  <span className="text-faint mx-2">–</span>
                  <span className={!awayWon ? "text-accent" : "text-muted"}>
                    {data.home.score}
                  </span>
                </span>
                <span
                  className={`font-display text-base font-bold ${
                    !awayWon ? "text-text" : "text-muted"
                  }`}
                >
                  {data.home.team.shortName}
                </span>
                {ot > 0 && (
                  <span className="text-[11px] font-mono font-bold tracking-wider px-2 py-1 rounded-sm bg-accent/15 text-accent-soft">
                    {ot === 1 ? "OT" : `${ot}OT`}
                  </span>
                )}
              </div>

              {data.flow && data.flow.length > 1 && (
                <ScoreFlow
                  flow={data.flow}
                  home={data.home.team}
                  away={data.away.team}
                  periods={data.periods}
                />
              )}
              <BoxScoreTable away={data.away} home={data.home} />
              <BreakdownList
                breakdown={data.breakdown}
                context={data.context}
                base={data.base}
                score={data.watchScore}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
