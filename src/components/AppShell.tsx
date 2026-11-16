import Link from "next/link";
import { NavBar } from "./NavBar";

// Skal for innlogga sider: topptekst + navigasjon rundt innhaldet
export default function AppShell({ householdName, children }: { householdName: string; children: React.ReactNode }) {
  return (
    <>
      {/* Ingen backdrop-blur på mobil: det ville gjort toppteksten til ankeret for den faste botn-fana */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg sm:bg-bg/90 sm:backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2.5">
          <Link href="/" className="flex min-w-0 items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight">NiceToKnow</span>
            <span className="truncate text-sm text-muted">{householdName}</span>
          </Link>
          <NavBar />
        </div>
      </header>
      {/* pb gir plass til botn-fana på mobil */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-4 pb-24 sm:pb-8">{children}</main>
    </>
  );
}
