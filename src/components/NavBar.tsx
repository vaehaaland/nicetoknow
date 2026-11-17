"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconName } from "@/lib/icons";
import { Icon } from "./Icon";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Oversikt", icon: "dashboard" },
  { href: "/chat", label: "Spør Claude", icon: "wand_stars" },
  { href: "/innstillingar", label: "Innstillingar", icon: "settings" },
];

// M3 navigation bar nedst på mobil; frå sm og opp ligg lenkjene i topplinja
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 bg-container pb-[env(safe-area-inset-bottom)] sm:static sm:bg-transparent sm:pb-0">
      <ul className="mx-auto flex max-w-3xl sm:gap-1">
        {LINKS.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 sm:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex h-20 flex-col items-center justify-center gap-1 text-xs font-medium sm:h-10 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm ${
                  active ? "text-text sm:bg-secondary-container sm:text-on-secondary-container" : "text-muted"
                }`}
              >
                {/* Aktiv-indikatoren: pille bak ikonet (berre på mobil) */}
                <span
                  className={`flex h-8 w-16 items-center justify-center rounded-full transition-colors sm:h-auto sm:w-auto sm:bg-transparent ${
                    active ? "bg-secondary-container text-on-secondary-container" : "group-hover:bg-text/8"
                  }`}
                >
                  <Icon name={icon} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
