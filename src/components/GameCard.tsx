"use client";

import { useState } from "react";
import type { GamePreview, GameReveal, TeamInfo } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";
import { BoxScoreTable } from "./BoxScoreTable";
import { BreakdownList } from "./BreakdownList";

/** ESPN podaje kolor jako hex bez #; fallback gdy brak. */
function teamColor(c: string | null, fallback: string): string {
  if (!c) return fallback;
  return c.startsWith("#") ? c : `#${c}`;
}

function TeamRow({
  team,
  color,
  align = "left",
}: {
  team: TeamInfo;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-3 min-w-0 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div className="relative shrink-0">
        <span
          className="absolute -inset-1 rounded-full opacity-40 blur-md"
          style={{ background: color }}
          aria-hidden="true"
        />
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logo} alt="" className="relative h-10 w-10 sm:h-12 sm:w-12" />
        ) : (
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10" />
        )}
      </div>
      <div className="min-w-0">
        <div className="font-display text-lg sm:text-2xl font-extrabold leading-none tracking-wide">
          {team.abbreviation}
        </div>
        <div className="text-xs text-faint truncate mt-1">{team.shortName}</div>
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

  const awayColor = teamColor(preview.away.color, "#ff7a2e");
  const homeColor = teamColor(preview.home.color, "#6f8bff");
  const ot = data && data.periods > 4 ? data.periods - 4 : 0;
  const awayWon = data ? data.away.score > data.home.score : false;

  return (
    <article className="group glass glass-hover rounded-[var(--radius-card)] overflow-hidden relative">
      {/* akcent kolorów drużyn na lewej krawędzi */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: `linear-gradient(${awayColor}, ${homeColor})` }}
        aria-hidden="true"
      />

      {/* pasek nagłówka — cały klikalny */}
      <button
        onClick={handleClick}
        aria-expanded={open}
        className="w-full text-left grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-5 sm:gap-8 pl-6 pr-5 sm:pr-7 py-5 cursor-pointer"
      >
        {/* matchup — wypełnia środek: away ⚔ home */}
        <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-7 min-w-0">
          <div className="flex-1 sm:flex-none sm:w-40">
            <TeamRow team={preview.away} color={awayColor} />
          </div>
          <span className="font-display text-sm font-bold text-faint shrink-0 px-2">
            vs
          </span>
          <div className="flex-1 sm:flex-none sm:w-40 flex sm:block justify-end">
            <TeamRow team={preview.home} color={homeColor} align="right" />
          </div>
        </div>

        {/* prawy klaster: tier + gauge + chevron */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <div className="flex flex-col items-start sm:items-end gap-2 order-2 sm:order-1">
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              {preview.context.kind !== "regular" && (
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent-2/20 text-[#aab8ff] border border-[#aab8ff]/30 whitespace-nowrap">
                  {preview.context.label}
                </span>
              )}
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
            </div>
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

          <div className="order-1 sm:order-2">
            <ScoreGauge score={preview.watchScore} tier={preview.tier} size={92} />
          </div>

          <div className="order-3 shrink-0 h-10 w-10 rounded-full glass-soft flex items-center justify-center text-muted transition-colors group-hover:text-text">
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
            <div className="pl-6 pr-5 sm:pr-7 pb-7 pt-1 space-y-4 animate-fade-up">
              {/* wynik */}
              <div
                className="glass-soft rounded-2xl px-5 py-4 flex items-center justify-center gap-5 relative overflow-hidden"
                style={{
                  background: `linear-gradient(110deg, ${awayColor}1a, transparent 45%, ${homeColor}1a)`,
                }}
              >
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
    </article>
  );
}
