"use client";

// Powłoka aplikacji: górny pasek (desktop: nawigacja), dolny pasek zakładek
// (telefon i zainstalowana aplikacja), przycisk instalacji i service worker.

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, Tv, Shield, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Mecze", icon: Tv, match: (p) => p === "/" },
  {
    href: "/druzyny",
    label: "Drużyny",
    icon: Shield,
    match: (p) => p.startsWith("/druzyn"),
  },
  { href: "/ranking", label: "Ranking", icon: Trophy, match: (p) => p.startsWith("/ranking") },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0 rounded-lg" aria-label="NBA Watch, strona główna">
      <Image src="/ikony/znak-96.png" alt="" width={32} height={32} className="rounded-full" priority />
      <span className="font-display text-[22px] font-extrabold leading-none tracking-tight">
        NBA Watch
      </span>
    </Link>
  );
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };

function InstallButton() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    const onInstalled = () => setEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!evt) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await evt.prompt();
        await evt.userChoice;
        setEvt(null);
      }}
      className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-surface-2 hover:bg-surface-hover text-sm font-medium transition-colors"
    >
      <Download size={16} aria-hidden />
      Zainstaluj
    </button>
  );
}

function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // brak SW = zwykła strona; nic do zrobienia
    });
  }, []);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  useServiceWorker();

  return (
    <>
      <header className="sticky top-0 z-40 pt-safe bg-bg/85 backdrop-blur-xl border-b border-line">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 h-14 lg:h-16 flex items-center gap-8">
          <Brand />
          <nav className="hidden lg:flex items-center gap-1" aria-label="Główna nawigacja">
            {NAV.map((n) => {
              const active = n.match(pathname);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`h-9 px-3.5 inline-flex items-center rounded-lg text-[15px] font-medium transition-colors ${
                    active ? "bg-surface-2 text-text" : "text-muted hover:text-text"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <InstallButton />
          </div>
        </div>
      </header>

      <div className="pb-tabbar">{children}</div>

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-bg/90 backdrop-blur-xl border-t border-line"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Zakładki"
      >
        <ul className="grid grid-cols-3 h-[60px]">
          {NAV.map((n) => {
            const active = n.match(pathname);
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                    active ? "text-text" : "text-faint"
                  }`}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.9} aria-hidden />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8 text-sm text-faint flex flex-wrap gap-x-6 gap-y-2">
      <span>Dane meczów: ESPN.</span>
      <span>Ocena jest autorska i nigdy nie zdradza, kto wygrał.</span>
    </footer>
  );
}
