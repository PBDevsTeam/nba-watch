// Warstwa cache pełnych ocen per mecz.
//
// Pełna ocena wymaga pobrania summary (box score + play-by-play, ~400 KB) KAŻDEGO
// meczu osobno. Zakończony mecz się nie zmienia, więc wynik oceny trzymamy w Data
// Cache bez terminu ważności. Klucz zawiera MODEL_VERSION: po zmianie modelu
// stare oceny przestają być używane same z siebie.
//
// Do cache trafia tylko mała liczba i ranga meczu, a nie cała odpowiedź ESPN.

import { unstable_cache } from "next/cache";
import { getGameSummary, mapLimit } from "./espn";
import { MODEL_VERSION, computeWatchability, tierForScore } from "./watchability";
import type { WatchContext, WatchTier } from "./types";

export type CachedScore = { score: number; tier: WatchTier; context: WatchContext };

type StoredScore = { score: number; context: WatchContext };

const scoreByGameId = unstable_cache(
  async (gameId: string): Promise<StoredScore> => {
    const summary = await getGameSummary(gameId);
    // Mecz w toku nie może trafić do cache na zawsze: rzucamy, wtedy nic nie jest zapisane.
    if (!summary.completed) throw new Error(`Mecz ${gameId} jeszcze się nie zakończył`);
    const { score, context } = computeWatchability(summary);
    return { score, context };
  },
  ["ocena-meczu", `model-${MODEL_VERSION}`],
  { revalidate: false, tags: ["oceny-meczow"] }
);

/** Pełna ocena meczu (z cache). Zwraca null przy błędzie — wywołujący filtruje. */
export async function getCachedScore(gameId: string): Promise<CachedScore | null> {
  try {
    const { score, context } = await scoreByGameId(gameId);
    return { score, tier: tierForScore(score), context };
  } catch {
    return null;
  }
}

/**
 * Oceny wielu meczów z limitem współbieżności (chroni nieoficjalne API ESPN).
 * `deadline` (ms od epoki) przerywa dociąganie nowych ocen, gdy kończy się czas
 * funkcji; to, co już policzone, zostaje w cache na następny raz.
 */
export async function getCachedScores(
  gameIds: string[],
  opts: { concurrency?: number; deadline?: number } = {}
): Promise<Map<string, CachedScore>> {
  const out = new Map<string, CachedScore>();
  const unique = [...new Set(gameIds)];
  await mapLimit(unique, opts.concurrency ?? 8, async (id) => {
    if (opts.deadline && Date.now() > opts.deadline) return;
    const res = await getCachedScore(id);
    if (res) out.set(id, res);
  });
  return out;
}
