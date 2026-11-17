// Loga drużyn z CDN ESPN. API podaje PNG 500×500 (~45 KB) w wariancie na jasne
// tło; CDN ma też wariant "500-dark" (czytelny na granacie, np. czarne logo Nets)
// i potrafi zmniejszyć obrazek (~5 KB zamiast ~45 KB).

const ESPN_LOGO = /teamlogos\/nba\/500(?:-dark)?\/(?:scoreboard\/)?([a-z]+)\.png/i;

/** Adres logo w wariancie na ciemne tło, przeskalowanego do `px` (×2 dla ekranów retina). */
export function logoSrc(url: string | null, px: number): string | null {
  if (!url) return null;
  const m = ESPN_LOGO.exec(url);
  if (!m) return url;
  const size = Math.round(px * 2);
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500-dark/${m[1].toLowerCase()}.png&w=${size}&h=${size}`;
}

/** Kolor drużyny z ESPN (hex bez #) albo zapasowy. */
export function teamColor(c: string | null, fallback = "#36406a"): string {
  if (!c) return fallback;
  return c.startsWith("#") ? c : `#${c}`;
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const NEUTRAL_LIGHT = "#c4cbe0";
const NEUTRAL_MID = "#7f89aa";

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Rozjaśnia kolor (miesza z bielą), aż będzie widoczny na granatowym tle. */
function lighten(hex: string, minLum = 0.16): string {
  const base = rgb(hex);
  for (let t = 0; t <= 1; t += 0.05) {
    const mixed = base.map((v) => v + (255 - v) * t) as [number, number, number];
    const h = toHex(mixed);
    if (luminance(h) >= minLum) return h;
  }
  return "#ffffff";
}

/**
 * Kolory dwóch drużyn czytelne na granatowym tle wykresu. Ciemny kolor
 * (granat 76ers) rozjaśniamy, zachowując odcień; prawie czarny (Nets, Spurs)
 * zastępujemy neutralnym. Gdy oba kolory są do siebie podobne, gość dostaje
 * neutralny, żeby dało się je odróżnić.
 */
export function chartColors(home: string | null, away: string | null): [string, string] {
  const fix = (c: string | null, fb: string) => {
    const hex = teamColor(c, fb);
    const [r, g, b] = rgb(hex);
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (chroma < 24) return luminance(hex) < 0.16 ? fb : hex; // szarości i czerń
    return luminance(hex) < 0.16 ? lighten(hex) : hex;
  };
  const h = fix(home, NEUTRAL_LIGHT);
  let a = fix(away, NEUTRAL_MID);
  const [r1, g1, b1] = rgb(h);
  const [r2, g2, b2] = rgb(a);
  const dist = Math.hypot(r1 - r2, g1 - g2, b1 - b2);
  if (dist < 90) a = h === NEUTRAL_LIGHT ? NEUTRAL_MID : NEUTRAL_LIGHT;
  return [h, a];
}
