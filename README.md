# NBA Watch

Ocena 0–100 każdego meczu NBA: czy warto obejrzeć powtórkę. Bez zdradzania wyniku,
z godzinami czasu polskiego. Strona i aplikacja PWA (instalowana na telefonie i komputerze).

Produkcja: https://nba-watch.pbdevs.com (Coolify PB Devs, wdrożenie: `docs/WDROZENIE.md`).

## Jak to działa

- **Dane**: nieoficjalne API ESPN (`site.api.espn.com`), bez klucza.
- **Ocena** (`src/lib/watchability.ts`): siedem „powodów, aby obejrzeć”, każdy oceniany
  osobno 0–100: dramat końcówki, wielki powrót, dogrywka, eksplozja punktowa, wyczyn
  (triple-double, rekord), festiwal ofensywy i stawka meczu (mecz 7, mecz o odpadnięcie).
  Wynik = 70% najmocniejszego powodu + 30% pozostałych, razy mnożnik rangi
  (play-in ×1,08, play-off ×1,12–1,2, finały ×1,25).
- **Ranga meczu** (`src/lib/kontekst.ts`): z `header.season.type` (liczba: 2 sezon
  zasadniczy, 3 play-off, 5 play-in) i notki meczu (`"NBA Finals - Game 7"`). Przed
  odkryciem wyniku pokazujemy tylko rundę i numer meczu, nigdy stan serii.
- **Bez spoilerów**: lista meczów nie dostaje wyniku. Wynik, box score i przebieg
  przychodzą z `/api/game/[id]` dopiero po kliknięciu.

## Cache i ograniczenia ESPN

- Ocena zakończonego meczu jest trzymana w Data Cache **bez terminu ważności**
  (`src/lib/scores.ts`). Klucz zawiera `MODEL_VERSION`: po każdej zmianie modelu podbij
  ją w `watchability.ts`, wtedy oceny policzą się od nowa.
- Scoreboard **nie przyjmuje już zakresu dat** (`dates=A-B` zwraca 400), więc zakresy
  składamy z pojedynczych dni (`getScoreboardDays`).
- CDN ESPN (Akamai) po kilkuset równoległych zapytaniach zaczyna odpowiadać 403 na
  wszystko z danego klienta. Dlatego `fetchJson` ma wspólny limit 6 zapytań naraz
  i jedno ponowienie. Nie podnoś tego limitu.
- Ranking sezonu ma własny cache (1 h), zapisywany tylko wtedy, gdy policzył się
  w całości. Niepełny ranking jest pokazywany z informacją, że reszta się liczy.

## Cron

`/api/cron/rozgrzej` raz dziennie ocenia mecze z ostatnich dni i dolicza brakujące oceny
do rankingu. Na Coolify wywołuje go zadanie cykliczne `node rozgrzej.mjs`
(`docs/WDROZENIE.md`), na Vercelu `vercel.json`. Gdy ustawisz zmienną `CRON_SECRET`,
endpoint przyjmie tylko wywołania z nagłówkiem `Authorization: Bearer <sekret>`.

## Praca lokalna

```bash
npm ci
npm run dev          # http://localhost:3000
npm test             # testy modelu, rangi meczu i dat (node --test, bez dodatkowych paczek)
npm run typecheck    # tsc --noEmit
npm run lint
npm run build
```

## Grafiki

Ikona aplikacji, obrazek do udostępniania i ilustracja pustej nocy są w `grafiki/`
(źródła 1024 px i większe). `npm run ikony` generuje z nich favicon, ikony PWA
(`public/ikony/`), `src/app/opengraph-image.jpg` i `public/grafiki/pusta-noc.webp`.

## Struktura

```
src/lib/espn.ts          klient ESPN (typy odpowiedzi, limit równoległości)
src/lib/watchability.ts  model oceny
src/lib/kontekst.ts      ranga i stawka meczu
src/lib/scores.ts        cache ocen per mecz
src/lib/games.ts         dane dla stron: noc, kalendarz, drużyna, ranking, odkrycie
src/lib/dates.ts         daty ET, sezony, czas polski
src/app/                 strony, API, manifest PWA
public/sw.js             service worker (strony: najpierw sieć; zasoby: z pamięci)
```
