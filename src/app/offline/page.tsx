import type { Metadata } from "next";
import { EmptyState } from "@/components/blocks";

export const metadata: Metadata = { title: "Brak połączenia" };

// Strona zapasowa service workera (public/sw.js), gdy telefon jest offline.
export default function Offline() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-10">
      <EmptyState title="Brak połączenia z internetem" action={{ href: "/", label: "Spróbuj ponownie" }}>
        Oceny meczów pobieramy na bieżąco z ESPN. Połącz się z siecią i odśwież stronę.
      </EmptyState>
    </main>
  );
}
