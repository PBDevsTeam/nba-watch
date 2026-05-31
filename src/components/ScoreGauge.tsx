import type { WatchTier } from "@/lib/types";

export function ScoreGauge({
  score,
  tier,
  size = 120,
}: {
  score: number;
  tier: WatchTier;
  size?: number;
}) {
  const stroke = size * 0.085;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = c * (1 - pct);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Wskaźnik oglądalności ${score} na 100 — ${tier.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tier.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)",
            filter: `drop-shadow(0 0 6px ${tier.color}55)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold leading-none"
          style={{ fontSize: size * 0.3, color: tier.color }}
        >
          {score}
        </span>
        <span
          className="font-mono text-faint leading-none mt-0.5"
          style={{ fontSize: size * 0.1 }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
