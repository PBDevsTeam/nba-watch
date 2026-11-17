// Małe, współdzielone klocki interfejsu (bez stanu, działają po obu stronach).

import type { TeamInfo, WatchContext, WatchTier, WatchTierKey } from "@/lib/types";
import { contextShortLabel } from "@/lib/kontekst";
import { logoSrc } from "@/lib/logo";

const INK_ON_TIER: Record<WatchTierKey, string> = {
  must: "var(--bg)",
  great: "var(--bg)",
  good: "var(--bg)",
  average: "var(--bg)",
  skip: "var(--text)",
};

export function tierVar(key: WatchTierKey): string {
  return `var(--t-${key})`;
}

/** Kolor tekstu poziomu na ciemnym tle (łupek "skip" jest za ciemny na tekst). */
export function tierTextVar(key: WatchTierKey): string {
  return key === "skip" ? "var(--muted)" : tierVar(key);
}

const SIZES = {
  sm: { box: 40, font: 22, radius: 8 },
  md: { box: 56, font: 32, radius: 10 },
  lg: { box: 72, font: 42, radius: 12 },
} as const;

/**
 * Ocena meczu: liczba w bloku w kolorze temperatury. To jedyny mocny akcent
 * w interfejsie — reszta jest neutralna.
 */
export function ScoreBlock({
  score,
  tier,
  size = "md",
  label,
}: {
  score: number | null;
  tier: WatchTier | null;
  size?: keyof typeof SIZES;
  label?: string;
}) {
  const s = SIZES[size];
  if (score === null || !tier) {
    return (
      <div
        className="grid place-items-center shrink-0 border border-dashed border-line-strong text-faint font-display font-bold"
        style={{ width: s.box, height: s.box, borderRadius: s.radius, fontSize: s.font * 0.6 }}
        aria-label={label ?? "Brak oceny"}
      >
        –
      </div>
    );
  }
  return (
    <div
      className="grid place-items-center shrink-0 font-display font-black tabular-nums leading-none"
      style={{
        width: s.box,
        height: s.box,
        borderRadius: s.radius,
        fontSize: s.font,
        background: tierVar(tier.key),
        color: INK_ON_TIER[tier.key],
      }}
      role="img"
      aria-label={`Ocena ${score} na 100: ${tier.label}`}
    >
      {score}
    </div>
  );
}

export function TierText({ tier, className = "" }: { tier: WatchTier; className?: string }) {
  return (
    <span className={`font-semibold ${className}`} style={{ color: tierTextVar(tier.key) }}>
      {tier.label}
    </span>
  );
}

export function TeamLogo({
  team,
  size = 28,
  className = "",
}: {
  team: Pick<TeamInfo, "logo" | "abbreviation">;
  size?: number;
  className?: string;
}) {
  const src = logoSrc(team.logo, size);
  if (!src) {
    return (
      <span
        className={`inline-block rounded-full bg-surface-2 shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- loga z CDN ESPN, już przeskalowane
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Ranga meczu (tylko play-off, play-in i finały; sezon zasadniczy nie ma etykiety). */
export function ContextChip({ context }: { context: WatchContext | null }) {
  if (!context || context.kind === "regular") return null;
  const hot = context.kind === "finals";
  return (
    <span
      className={`inline-flex items-center h-6 px-2 rounded-md text-xs font-semibold whitespace-nowrap ${
        hot ? "bg-t-must/15 text-t-must" : "bg-surface-hover text-muted"
      }`}
    >
      {contextShortLabel(context)}
    </span>
  );
}

export function Panel({
  title,
  aside,
  children,
  className = "",
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[var(--radius-panel)] bg-surface border border-line ${className}`}>
      {title && (
        <header className="flex items-baseline justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
          <h2 className="font-display text-xl font-extrabold leading-none">{title}</h2>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
