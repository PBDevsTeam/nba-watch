import type { MetadataRoute } from "next";

const SITE_URL = "https://nba-watch.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/druzyny`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/ranking`, changeFrequency: "weekly", priority: 0.7 },
  ];
}
