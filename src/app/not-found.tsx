import { EmptyState } from "@/components/blocks";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-10">
      <EmptyState title="Nie ma takiej strony" action={{ href: "/", label: "Wróć do meczów" }}>
        Adres jest nieaktualny albo zawiera literówkę.
      </EmptyState>
    </main>
  );
}
