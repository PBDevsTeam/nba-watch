"use client";

import { useState } from "react";
import type { GamePreview, GameReveal } from "@/lib/types";
import { ScoreGauge } from "./ScoreGauge";
import { BoxScoreTable } from "./BoxScoreTable";
import { BreakdownList } from "./BreakdownList";

function TeamBadge({
  logo,
  abbr,
}: {
  logo: string | null;
  abbr: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-7 w-7 shrink-0" />
      ) : (
        <div className="h-7 w-7 rounded-full bg-border shrink-0" />
      )}
      <span className="font-display font-semibold tracking-wide">{abbr}</span>
    </div>
  );
}

export function GameCard({ preview }: { preview: GamePreview }) {
  const [state, setState] = useState<"idle" | "loading" | "revealed" | "error">(
    "idle"
  );
  const [data, setData] = useState<GameReveal | null>(null);

  async function reveal() {
    setState("loading");
    try {
      const res = await fetch(`/api/game/${preview.id}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
      setState("revealed");
    } catch {
      setState("error");
    }
  }

  const ot = data && data.periods > 4 ? data.periods - 4 : 0;
  const awayWon = data ? data.away.score > data.home.score : false;

  return (
    <article className="group rounded-[var(--radius-card)] border border-border bg-surface/70 backdrop-blur-sm overflow-hidden transition-colors hover:border-border-strong">
      {/* nagłówek meczu */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div className="flex flex-col gap-2">
          <TeamBadge logo={preview.away.logo} abbr={preview.away.abbreviation} />
          <TeamBadge logo={preview.home.logo} abbr={preview.home.abbreviation} />
        </div>
        <div
          className="text-xs font-medium px-2.5 py-1 rounded-full border"
          style={{
            color: preview.tier.color,
            borderColor: `${preview.tier.color}40`,
            background: `${preview.tier.color}12`,
          }}
        >
          {preview.tier.emoji} {preview.tier.label}
        </div>
      </div>

      {/* gauge */}
      <div className="flex justify-center py-6">
        <ScoreGauge score={preview.watchScore} tier={preview.tier} size={132} />
      </div>

      {/* CTA / reveal */}
      {state !== "revealed" && (
        <div className="px-5 pb-5">
          <button
            onClick={reveal}
            disabled={state === "loading"}
            className="w-full rounded-xl border border-border-strong bg-bg-elev py-3 text-sm font-medium text-text transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            {state === "loading"
              ? "Odkrywam…"
              : state === "error"
              ? "Błąd — spróbuj ponownie"
              : "Odkryj wynik i szczegóły"}
          </button>
          <p className="mt-2 text-center text-xs text-faint">
            Wskaźnik nie zdradza kto wygrał
          </p>
        </div>
      )}

      {/* po revealu */}
      {state === "revealed" && data && (
        <div className="px-5 pb-5 space-y-5 animate-fade-up">
          {/* wynik */}
          <div className="rounded-xl border border-border bg-bg-elev p-4">
            <div className="flex items-center justify-between text-sm">
              <span className={awayWon ? "font-semibold text-text" : "text-muted"}>
                {data.away.team.shortName}
              </span>
              <span className="font-mono text-lg font-bold tabular-nums">
                <span className={awayWon ? "text-text" : "text-muted"}>
                  {data.away.score}
                </span>
                <span className="text-faint mx-1.5">–</span>
                <span className={!awayWon ? "text-text" : "text-muted"}>
                  {data.home.score}
                </span>
              </span>
              <span className={!awayWon ? "font-semibold text-text" : "text-muted"}>
                {data.home.team.shortName}
              </span>
            </div>
            {ot > 0 && (
              <div className="mt-2 text-center">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent-soft">
                  {ot === 1 ? "DOGRYWKA" : `${ot}× DOGRYWKA`}
                </span>
              </div>
            )}
          </div>

          <BoxScoreTable away={data.away} home={data.home} />
          <BreakdownList breakdown={data.breakdown} />
        </div>
      )}
    </article>
  );
}
