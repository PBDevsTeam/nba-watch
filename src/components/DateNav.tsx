"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatPl, isFuture, shiftDate } from "@/lib/dates";

export function DateNav({ date }: { date: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(iso: string) {
    startTransition(() => {
      router.push(`/?date=${iso}`);
    });
  }

  const prev = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const nextDisabled = isFuture(next);

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <button
        onClick={() => go(prev)}
        className="h-10 w-10 rounded-lg border border-border bg-surface text-muted hover:text-text hover:border-border-strong transition-colors"
        aria-label="Poprzedni dzień"
      >
        ‹
      </button>

      <label className="relative">
        <input
          type="date"
          value={date}
          max={shiftDate(date, isFuture(date) ? 0 : 365)}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="sr-only"
        />
        <span
          className={`inline-flex items-center justify-center min-w-[16rem] h-10 px-4 rounded-lg border border-border bg-surface font-display font-medium cursor-pointer hover:border-border-strong transition-colors ${
            pending ? "opacity-60" : ""
          }`}
          onClick={(e) =>
            (e.currentTarget.previousElementSibling as HTMLInputElement)?.showPicker?.()
          }
        >
          {formatPl(date)}
        </span>
      </label>

      <button
        onClick={() => !nextDisabled && go(next)}
        disabled={nextDisabled}
        className="h-10 w-10 rounded-lg border border-border bg-surface text-muted hover:text-text hover:border-border-strong transition-colors disabled:opacity-30 disabled:hover:text-muted"
        aria-label="Następny dzień"
      >
        ›
      </button>
    </div>
  );
}
