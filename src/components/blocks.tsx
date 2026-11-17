// Bloki stron (serwerowe): legenda skali, pusty stan, szkielety ładowania.

import Image from "next/image";
import Link from "next/link";
import { TIERS } from "@/lib/watchability";
import type { WatchTier } from "@/lib/types";
import { Panel, tierVar } from "./ui";

export function TierLegend() {
  const ranges = TIERS.map((t, i) => {
    const max = i === 0 ? 100 : TIERS[i - 1].min - 1;
    return { t, range: `${t.min}–${max}` };
  });
  return (
    <Panel title="Jak czytać ocenę">
      <p className="px-4 sm:px-5 text-sm text-muted leading-relaxed">
        Liczba od 0 do 100 mówi, ile emocji dał mecz: końcówka, dogrywka, powrót z dużej
        straty, wielki występ, stawka meczu. Nigdy nie mówi, kto wygrał.
      </p>
      <ul className="mt-3 pb-2">
        {ranges.map(({ t, range }) => (
          <li key={t.key} className="flex items-center gap-3 px-4 sm:px-5 py-2.5 border-t border-line">
            <span className="h-3.5 w-3.5 rounded-[4px] shrink-0" style={{ background: tierVar(t.key) }} />
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-tight">{t.label}</span>
              <span className="block text-xs text-faint">{t.hint}</span>
            </span>
            <span className="ml-auto text-sm text-faint tabular-nums">{range}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Rząd kwadracików: jeden mecz = jeden kwadrat w kolorze oceny. Temperatura nocy w pigułce. */
export function NightHeat({ tiers }: { tiers: WatchTier[] }) {
  if (tiers.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-[3px]" aria-hidden>
      {tiers.map((t, i) => (
        <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: tierVar(t.key) }} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-surface overflow-hidden">
      <Image
        src="/grafiki/pusta-noc.webp"
        alt=""
        width={1200}
        height={750}
        className="w-full h-auto max-h-[300px] object-cover object-center"
      />
      <div className="px-5 pb-6 -mt-6 relative text-center">
        <p className="font-display text-2xl font-extrabold">{title}</p>
        {children && <div className="mt-2 text-muted max-w-md mx-auto">{children}</div>}
        {action && (
          <Link
            href={action.href}
            className="mt-4 inline-flex h-10 items-center px-4 rounded-lg bg-text text-bg font-semibold text-sm"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Wczytywanie">
      <div className="skeleton h-12 w-3/4 max-w-[28rem]" />
      <div className="skeleton h-4 w-1/2 max-w-[20rem] mt-3" />
      <div className="mt-6 rounded-[var(--radius-panel)] bg-surface border border-line divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-5 px-5 py-4">
            <div className="skeleton h-14 w-14 rounded-[10px]" />
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-5 w-52 max-w-full" />
              <div className="skeleton h-5 w-44 max-w-full" />
            </div>
            <div className="skeleton h-4 w-24 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PartialNotice({ done, total }: { done: number; total: number }) {
  if (done >= total) return null;
  return (
    <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
      Oceniono {done} z {total} meczów. Reszta liczy się w tle, odśwież stronę za minutę.
    </p>
  );
}
