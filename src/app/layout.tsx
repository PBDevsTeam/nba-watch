import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
        {/* żywa atmosfera pod szkłem */}
        <div className="atmos" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="orb orb-3" />
          <span className="orb orb-4" />
        </div>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
