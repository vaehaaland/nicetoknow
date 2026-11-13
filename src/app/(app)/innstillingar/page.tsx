import { CopyButton } from "@/components/CopyButton";
import { requireHousehold } from "@/lib/household";
import { signOut } from "../../login/actions";
import { renameHousehold } from "../actions";

export default async function SettingsPage() {
  const { supabase, household } = await requireHousehold();
  const { count } = await supabase.from("household_members").select("*", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Innstillingar</h1>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold">Inviter partnaren</h2>
        <p className="text-sm text-muted">
          Partnaren opprettar konto og skriv inn denne koden for å sjå det same som deg.
          {count ? ` ${count} ${count === 1 ? "medlem" : "medlemmer"} no.` : ""}
        </p>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-bg py-1.5 pr-1.5 pl-3">
          <p className="font-mono text-lg font-semibold tracking-wider select-all">{household.invite_code}</p>
          <CopyButton value={household.invite_code} />
        </div>
      </section>

      <form action={renameHousehold} className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold">Namn på husstanden</h2>
        <input type="hidden" name="id" value={household.id} />
        <div className="flex gap-2">
          <input className="field" name="name" defaultValue={household.name} maxLength={80} required />
          <button className="btn-ghost shrink-0">Lagre</button>
        </div>
      </form>

      <form action={signOut}>
        <button className="btn-ghost w-full">Logg ut</button>
      </form>
    </div>
  );
}
