<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Zasady projektu

- Kod, komentarze i teksty interfejsu po polsku.
- Przed oddaniem pracy: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Zmiana modelu oceny (krzywe, wagi, nowe powody) = podbij `MODEL_VERSION`
  w `src/lib/watchability.ts`, inaczej w cache zostaną stare oceny.
- Nie podnoś limitu równoległych zapytań do ESPN (`MAX_PARALLEL` w `src/lib/espn.ts`):
  CDN ESPN odcina klienta po kilkuset równoległych zapytaniach.
- Wynik meczu, stan serii play-off ani nic, z czego da się wywnioskować zwycięzcę, nie
  może trafić do danych wysyłanych przed kliknięciem „Pokaż wynik”.
- Kolory poziomów oceny to zmienne CSS `--t-<poziom>` w `src/app/globals.css`;
  w stylach inline używaj `var(--t-must)` itd. (zmienne `--color-*` z `@theme inline`
  nie istnieją w czasie działania strony).
