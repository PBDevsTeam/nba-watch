import { ListSkeleton } from "@/components/blocks";

export default function Loading() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
      <ListSkeleton rows={8} />
      <p className="mt-4 text-sm text-faint">Liczymy oceny meczów z całego sezonu. Pierwszy raz może to potrwać kilkanaście sekund.</p>
    </main>
  );
}
