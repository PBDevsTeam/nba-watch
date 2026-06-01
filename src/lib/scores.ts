// Warstwa cache pełnych wskaźników per mecz.
//
// Liczenie pełnego wskaźnika wymaga pobrania box score + play-by-play (summary)
// KAŻDEGO meczu osobno. Dla kalendarza/drużyn/rankingu (setki meczów) to za wolno
// na żywo. Ale zakończone mecze są NIEZMIENNE -> cache'ujemy wynik per gameId
// na bardzo długo. Dzięki temu kropka w kalendarzu = dokładnie ta sama ocena,
// którą zobaczysz po wejściu w mecz (koniec rozjazdu heurystyka vs pełny model).

import { unstable_cache } from "next/cache";
import { getGameSummary } from "./espn";
import { computeWatchability } from "./watchability";
import type { WatchTier } from "./types";

export type CachedScore = { score: number; tier: WatchTier };

// Zakończony mecz się nie zmienia -> trzymamy ~30 dni, tag do ewentualnej inwalidacji.
const cachedByGameId = unstable_cache(
  async (gameId: string): Promise<CachedScore> => {
    const summary = await getGameSummary(gameId);
    const { score, tier } = computeWatchability(summary);
    return { score, tier };
  },
  ["game-score"],
  { revalidate: 60 * 60 * 24 * 30, tags: ["game-score"] }
);

/** Pełny wskaźnik meczu (z cache). Zwraca null przy błędzie — caller filtruje. */
export async function getCachedScore(gameId: string): Promise<CachedScore | null> {
  try {
    return await cachedByGameId(gameId);
  } catch {
    return null;
  }
}

/**
 * Pełne wskaźniki wielu meczów równolegle, z limitem współbieżności
 * (chroni nieoficjalne API ESPN przed zalewem requestów). Pierwszy przebieg
 * dla miesiąca jest wolniejszy, kolejne lecą z cache.
 */
export async function getCachedScores(
  gameIds: string[],
  concurrency = 16
): Promise<Map<string, CachedScore>> {
  const out = new Map<string, CachedScore>();
  let i = 0;
  async function worker() {
    while (i < gameIds.length) {
      const idx = i++;
      const id = gameIds[idx];
      const res = await getCachedScore(id);
      if (res) out.set(id, res);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, gameIds.length) }, worker);
  await Promise.all(workers);
  return out;
}
