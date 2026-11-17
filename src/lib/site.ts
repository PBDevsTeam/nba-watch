// Stałe strony w jednym miejscu (metadane, sitemap, robots, manifest).

// Docelowo Coolify PB Devs. Można nadpisać zmienną NEXT_PUBLIC_SITE_URL (przy budowaniu).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nba-watch.pbdevs.com").replace(/\/$/, "");
export const SITE_NAME = "NBA Watch";
export const SITE_TAGLINE = "Który mecz z nocy warto obejrzeć?";
export const SITE_DESCRIPTION =
  "Ocena 0–100 każdego meczu NBA: dramat końcówki, dogrywki, wielkie występy i stawka meczu. Bez zdradzania wyniku, z godzinami czasu polskiego.";
export const THEME_COLOR = "#0f1426";
