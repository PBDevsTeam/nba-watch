import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME}: mecze NBA warte obejrzenia`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "pl",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    categories: ["sports", "entertainment"],
    icons: [
      { src: "/ikony/ikona-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikony/ikona-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/ikony/ikona-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Zrzuty do okna instalacji (Chrome na Androidzie i desktopie).
    screenshots: [
      {
        src: "/zrzuty/szeroki.webp",
        sizes: "1280x800",
        type: "image/webp",
        form_factor: "wide",
        label: "Mecze z jednej nocy z oceną 0–100, bez wyników",
      },
      {
        src: "/zrzuty/waski.webp",
        sizes: "780x1688",
        type: "image/webp",
        form_factor: "narrow",
        label: "Lista meczów nocy na telefonie",
      },
    ],
    shortcuts: [
      { name: "Ranking", url: "/ranking", icons: [{ src: "/ikony/ikona-192.png", sizes: "192x192" }] },
      { name: "Drużyny", url: "/druzyny", icons: [{ src: "/ikony/ikona-192.png", sizes: "192x192" }] },
    ],
  };
}
