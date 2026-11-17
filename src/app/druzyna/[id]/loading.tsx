import { ListSkeleton } from "@/components/blocks";

export default function Loading() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
      <div className="skeleton h-4 w-36 mb-5" />
      <div className="skeleton h-48 rounded-[var(--radius-panel)] mb-8" />
      <ListSkeleton rows={8} />
    </main>
  );
}
