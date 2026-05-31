import { useId } from "react";
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
  const gid = useId().replace(/:/g, "");
  const stroke = size * 0.09;
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
      {/* poświata pod pierścieniem */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${tier.color}33, transparent 68%)`,
        }}
      />
      <svg width={size} height={size} className="-rotate-90 relative">
        <defs>
          <linearGradient id={`grad-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tier.color} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#grad-${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)",
            filter: `drop-shadow(0 0 7px ${tier.color}77)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-extrabold leading-none tabular-nums"
          style={{ fontSize: size * 0.32, color: tier.color }}
        >
          {score}
        </span>
        <span
          className="font-mono text-faint leading-none mt-1 tracking-wider"
          style={{ fontSize: size * 0.095 }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
