"use client";

import { EmptyStateClient } from "@/components/EmptyStateClient";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-10">
      <EmptyStateClient title="Coś poszło nie tak">
        <p>Strona nie wczytała się do końca. Zwykle pomaga ponowna próba.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex h-10 items-center px-4 rounded-lg bg-text text-bg font-semibold text-sm"
        >
          Spróbuj ponownie
        </button>
      </EmptyStateClient>
    </main>
  );
}
