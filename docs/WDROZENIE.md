# Wdrożenie (Coolify)

Panel: `coolify.pbdevs.com`. DNS `*.pbdevs.com` wskazuje na VPS (wildcard), więc
`nba-watch.pbdevs.com` nie wymaga nowego rekordu.

## Aplikacja

Projekt `apps`, środowisko `production`, zasób `nba-watch`.

| Ustawienie | Wartość |
| --- | --- |
| Źródło | `PBDevsTeam/nba-watch`, gałąź `main` (push na main wdraża sam) |
| Build pack | Dockerfile (`/Dockerfile`, katalog `/`) |
| Port | `3000` |
| Domena | `https://nba-watch.pbdevs.com` |
| Trwały wolumen | `/app/.next/cache` (cache ocen meczów, ma przetrwać redeploy) |

Aplikacja nie ma bazy danych ani sekretów. Opcjonalne zmienne:

| Zmienna | Po co |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | inna domena niż `https://nba-watch.pbdevs.com` (Build Variable) |
| `CRON_SECRET` | gdy ustawiona, `/api/cron/rozgrzej` wymaga `Authorization: Bearer …` |

## Zadanie cykliczne

Coolify → zasób `nba-watch` → **Scheduled Tasks**:

| Pole | Wartość |
| --- | --- |
| Nazwa | `rozgrzej-cache` |
| Polecenie | `node rozgrzej.mjs` |
| Częstotliwość | `0 10 * * *` (10:00 UTC, po nocy meczowej) |

Skrypt (`scripts/rozgrzej.mjs`, w obrazie jako `/app/rozgrzej.mjs`) woła lokalnie
`/api/cron/rozgrzej`: ocenia mecze z ostatnich dni i dolicza brakujące oceny do rankingu.

## Sprawdzenie po wdrożeniu

```sh
curl -s -o /dev/null -w "%{http_code}\n" https://nba-watch.pbdevs.com/            # 200
curl -s https://nba-watch.pbdevs.com/manifest.webmanifest | head -c 80            # manifest PWA
curl -sI https://nba-watch.pbdevs.com/sw.js | grep -i cache-control               # no-cache
curl -s "https://nba-watch.pbdevs.com/api/heat?from=2026-11-01&to=2026-11-07"    # {"heat":{…}}
```

Pierwsze wejście na `/ranking` po świeżym wolumenie liczy oceny całego sezonu (ok. 20 s
na początku sezonu). Można to zrobić od razu: Scheduled Task → **Execute Now**.

## Uwaga o ESPN

CDN ESPN (Akamai) odcina klienta, który wyśle kilkaset zapytań naraz (403 na wszystko
przez kilka minut). Aplikacja ma wspólny limit 6 zapytań (`MAX_PARALLEL` w
`src/lib/espn.ts`); nie podnoś go.
