// Generuje ikony, favicon, obrazek OG i ilustracje z plików źródłowych w grafiki/.
// Źródła narysowała Astra (Codex, image_gen); tu tylko skalujemy i kompresujemy.
// Uruchom: npm run ikony
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = "#0f1426";
const ZNAK = "grafiki/znak-1024.png"; // pełny znak: ikony aplikacji (PWA, Apple)
const FAVICON = "grafiki/favicon-512.png"; // uproszczony znak: karta przeglądarki (16–48 px)

mkdirSync("public/ikony", { recursive: true });
mkdirSync("public/grafiki", { recursive: true });

const png = (src, size) =>
  sharp(src)
    .flatten({ background: BG })
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

async function zapisz(src, size, plik) {
  writeFileSync(plik, await png(src, size));
  console.log("zapisano", plik);
}

/**
 * Plik .ico z kilkoma PNG w środku (obsługują go wszystkie współczesne przeglądarki).
 * PNG muszą być RGBA (bez palety), inaczej build Next odrzuca plik.
 */
async function ico(src, sizes, plik) {
  const rgba = (size) =>
    sharp(src)
      .flatten({ background: BG })
      .resize(size, size, { kernel: "lanczos3" })
      .ensureAlpha()
      .png({ compressionLevel: 9, palette: false })
      .toBuffer();
  const images = await Promise.all(sizes.map(rgba));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); // zarezerwowane
  header.writeUInt16LE(1, 2); // typ: ikona
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((img, i) => {
    const e = 6 + 16 * i;
    const s = sizes[i];
    header.writeUInt8(s >= 256 ? 0 : s, e);
    header.writeUInt8(s >= 256 ? 0 : s, e + 1);
    header.writeUInt8(0, e + 2); // paleta
    header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4); // płaszczyzny
    header.writeUInt16LE(32, e + 6); // bity na piksel
    header.writeUInt32LE(img.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += img.length;
  });
  writeFileSync(plik, Buffer.concat([header, ...images]));
  console.log("zapisano", plik);
}

// Karta przeglądarki: favicon.ico (16/32/48) i icon.png (Next podpina oba z src/app).
await ico(FAVICON, [16, 32, 48], "src/app/favicon.ico");
await zapisz(FAVICON, 96, "src/app/icon.png");

// Ikona na ekranie głównym iOS.
await zapisz(ZNAK, 180, "src/app/apple-icon.png");

// Manifest PWA. Znak mieści się w środkowych ~66%, więc ta sama grafika nadaje się
// też jako ikona maskowalna (Android przycina do koła/squircle).
await zapisz(ZNAK, 192, "public/ikony/ikona-192.png");
await zapisz(ZNAK, 512, "public/ikony/ikona-512.png");
await zapisz(ZNAK, 512, "public/ikony/ikona-maskable-512.png");

// Znak do nagłówka strony (wyświetlany w 32 px, plik ×3 dla ekranów retina).
await zapisz(FAVICON, 96, "public/ikony/znak-96.png");

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
