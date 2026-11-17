// Zadanie cykliczne w Coolify (Scheduled Task, uruchamiane w kontenerze):
//   node rozgrzej.mjs
// Wywołuje /api/cron/rozgrzej lokalnie: ocenia mecze z ostatnich dni i dolicza
// brakujące oceny do rankingu. CRON_SECRET jest opcjonalny (patrz route.ts).
const port = process.env.PORT ?? "3000";
const secret = process.env.CRON_SECRET ?? "";
const res = await fetch(`http://127.0.0.1:${port}/api/cron/rozgrzej`, {
  headers: secret ? { authorization: `Bearer ${secret}` } : {},
});
console.log(res.status, await res.text());
if (!res.ok) process.exit(1);
