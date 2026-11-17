"use client";

// Wersja pustego stanu dla komponentów klienckich (np. error.tsx).
import Image from "next/image";

export function EmptyStateClient({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-surface overflow-hidden">
      <Image
        src="/grafiki/pusta-noc.webp"
        alt=""
        width={1200}
        height={750}
        className="w-full h-auto max-h-[300px] object-cover object-center"
      />
      <div className="px-5 pb-6 -mt-6 relative text-center text-muted">
        <p className="font-display text-2xl font-extrabold text-text">{title}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
