import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NBA Watch — czy warto obejrzeć?",
    short_name: "NBA Watch",
    description:
      "Wskaźnik oglądalności meczów NBA. Zobacz jak dobry był mecz, bez spoilerów.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e15",
    theme_color: "#0a0e15",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
