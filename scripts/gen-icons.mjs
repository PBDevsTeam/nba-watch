// Generator ikon NBA Watch — monogram "N" na pomarańczowym tle.
// Uruchom: node scripts/gen-icons.mjs
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";

const ACCENT = "#ff6b2c";
const BG = "#0a0e15";

// Monogram "N" — geometryczny, gruby. Ikona z marginesem (safe area).
function iconSvg(size, { rounded = true, bg = ACCENT, fg = BG } = {}) {
  const r = rounded ? Math.round(size * 0.22) : 0;
  // litera N narysowana jako ścieżka geometryczna, wyśrodkowana
  const pad = size * 0.28;
  const stroke = size * 0.13;
  const x0 = pad;
  const x1 = size - pad;
  const y0 = pad;
  const y1 = size - pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>
  <g stroke="${fg}" stroke-width="${stroke}" stroke-linecap="square" fill="none">
    <line x1="${x0}" y1="${y1}" x2="${x0}" y2="${y0}"/>
    <line x1="${x1}" y1="${y0}" x2="${x1}" y2="${y1}"/>
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>
  </g>
</svg>`;
}

const out = "src/app";
mkdirSync(out, { recursive: true });
mkdirSync("public", { recursive: true });

async function png(size, file, opts) {
  const buf = Buffer.from(iconSvg(size, opts));
  await sharp(buf).png().toFile(file);
  console.log("wrote", file);
}

// favicon.ico (Next używa public/favicon.ico lub app/icon)
await png(32, "src/app/icon.png");
await png(180, "src/app/apple-icon.png", { rounded: false });
await png(192, "public/icon-192.png");
await png(512, "public/icon-512.png");

// favicon multi-size do .ico — sharp nie robi .ico, więc dajemy png jako icon.png
console.log("done");
