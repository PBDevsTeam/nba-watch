import type { WatchTier } from "@/lib/types";

/**
 * Płaski, geometryczny wskaźnik wyniku — solidny blok z liczbą.
 * Kolor tła = kolor poziomu. Bez gradientów i poświat.
 */
export function ScoreGauge({
  score,
  tier,
  size = 56,
}: {
  score: number;
  tier: WatchTier;
  size?: number;
}) {
  return (
    <div
      className="grid place-items-center rounded-md shrink-0 font-display font-black tabular-nums leading-none"
      style={{
        width: size,
        height: size,
        background: tier.color,
        color: "#0a0e15",
        fontSize: size * 0.42,
      }}
      role="img"
      aria-label={`Wskaźnik ${score} na 100 — ${tier.label}`}
    >
      {score}
    </div>
  );
}
