import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const SITE_URL = "https://nba-watch.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NBA Watch — czy warto obejrzeć ten mecz?",
    template: "%s · NBA Watch",
  },
  description:
    "Wskaźnik oglądalności meczów NBA 0–100. Sprawdź jak emocjonujący był mecz — dramaturgia, dogrywki, gwiazdorskie występy — zanim poznasz wynik. Bez spoilerów.",
  keywords: [
    "NBA", "mecze NBA", "czy warto obejrzeć", "wskaźnik oglądalności",
    "box score", "wyniki NBA", "bez spoilerów", "koszykówka",
  ],
  authors: [{ name: "NBA Watch" }],
  applicationName: "NBA Watch",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: SITE_URL,
    siteName: "NBA Watch",
    title: "NBA Watch — czy warto obejrzeć ten mecz?",
    description:
      "Wskaźnik oglądalności meczów NBA 0–100. Zobacz jak dobry był mecz, zanim poznasz wynik. Bez spoilerów.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NBA Watch — czy warto obejrzeć ten mecz?",
    description:
      "Wskaźnik oglądalności meczów NBA 0–100. Bez spoilerów.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body
        className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
