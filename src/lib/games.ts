// Orkiestracja: scoreboard + summary -> lekkie GamePreview (bez spoilerów).

import { getGameSummary, getScoreboard } from "./espn";
import { toEspnDate } from "./dates";
import { computeWatchability } from "./watchability";
import type { GamePreview, GameReveal } from "./types";

/**
 * Zwraca podglądy meczów danego dnia, posortowane wg wskaźnika malejąco.
 * Wskaźnik liczony serwerowo z box score; do klienta NIE trafia wynik.
 */
export async function getPreviewsForDate(iso: string): Promise<GamePreview[]> {
  const games = await getScoreboard(toEspnDate(iso));
  const completed = games.filter((g) => g.completed);

  const previews = await Promise.all(
    completed.map(async (g): Promise<GamePreview | null> => {
      try {
        const summary = await getGameSummary(g.id);
        const { score, tier, context } = computeWatchability(summary);
        return {
          id: g.id,
          dateISO: iso,
          away: g.away,
          home: g.home,
          watchScore: score,
          tier,
          context,
        };
      } catch {
        return null;
      }
    })
  );

  return previews
    .filter((p): p is GamePreview => p !== null)
    .sort((a, b) => b.watchScore - a.watchScore);
}

/** Pełne dane meczu (spoilery) — używane przez /api/game/[id] po revealu. */
export async function getReveal(gameId: string): Promise<GameReveal> {
  const summary = await getGameSummary(gameId);
  const { score, base, tier, context, breakdown } = computeWatchability(summary);
  return {
    id: gameId,
    away: summary.away,
    home: summary.home,
    periods: summary.periods,
    watchScore: score,
    tier,
    context,
    base,
    breakdown,
  };
}
