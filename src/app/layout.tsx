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

export const metadata: Metadata = {
  title: "NBA Watch — czy warto obejrzeć?",
  description:
    "Wskaźnik oglądalności meczów NBA. Zobacz jak dobry był mecz, zanim poznasz wynik. Bez spoilerów.",
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
