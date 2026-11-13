"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Oversikt", icon: "🗂️" },
  { href: "/chat", label: "Spør Claude", icon: "✨" },
  { href: "/innstillingar", label: "Innstillingar", icon: "⚙️" },
];

// Botn-fane på mobil, vanleg toppmeny frå sm og opp
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:pb-0">
      <ul className="mx-auto flex max-w-3xl sm:gap-1">
        {LINKS.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 sm:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium sm:min-h-10 sm:flex-row sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-sm ${
                  active ? "text-accent sm:bg-surface" : "text-muted hover:text-text"
                }`}
              >
                <span aria-hidden className="text-lg sm:text-base">{icon}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
