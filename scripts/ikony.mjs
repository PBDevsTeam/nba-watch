// Generuje ikony, favicon, obrazek OG i ilustracje z plików źródłowych w grafiki/.
// Źródła narysowała Astra (Codex, image_gen); tu tylko skalujemy i kompresujemy.
// Uruchom: npm run ikony
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BG = "#0f1426";
const IKONA = "grafiki/ikona-1024.png";

mkdirSync("public/ikony", { recursive: true });
mkdirSync("public/grafiki", { recursive: true });

async function ikona(size, plik) {
  await sharp(IKONA)
    .flatten({ background: BG })
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(plik);
  console.log("zapisano", plik);
}

// Favicon i ikona Apple (Next podpina pliki z src/app automatycznie).
await ikona(64, "src/app/icon.png");
await ikona(180, "src/app/apple-icon.png");

// Manifest PWA. Znak mieści się w środkowych ~70%, więc ta sama grafika
// nadaje się też jako ikona maskowalna (Android przycina do koła/squircle).
await ikona(192, "public/ikony/ikona-192.png");
await ikona(512, "public/ikony/ikona-512.png");
await ikona(512, "public/ikony/ikona-maskable-512.png");

// Obrazek do udostępniania linku (Open Graph / X).
await sharp("grafiki/og-1200x630.png")
  .flatten({ background: BG })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile("src/app/opengraph-image.jpg");
console.log("zapisano src/app/opengraph-image.jpg");

// Ilustracja pustego stanu (noc bez meczów, brak połączenia).
await sharp("grafiki/pusta-noc-1600x1000.png")
  .flatten({ background: BG })
  .resize(1200, 750)
  .webp({ quality: 80 })
  .toFile("public/grafiki/pusta-noc.webp");
console.log("zapisano public/grafiki/pusta-noc.webp");
