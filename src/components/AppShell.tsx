import Link from "next/link";
import { NavBar } from "./NavBar";

// Skal for innlogga sider: topplinje (top app bar) + navigasjon rundt innhaldet
export default function AppShell({ householdName, children }: { householdName: string; children: React.ReactNode }) {
  return (
    <>
      {/* Ingen backdrop-filter her: det ville gjort topplinja til ankeret for den faste botn-navigasjonen */}
      <header className="sticky top-0 z-10 bg-bg">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex min-w-0 items-baseline gap-2">
            <span className="text-[22px] leading-7 font-medium text-accent">NiceToKnow</span>
            <span className="truncate text-sm text-muted">{householdName}</span>
          </Link>
          <NavBar />
        </div>
      </header>
      {/* pb gir plass til botn-navigasjonen på mobil */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-2 pb-28 sm:pb-8">{children}</main>
    </>
  );
}
