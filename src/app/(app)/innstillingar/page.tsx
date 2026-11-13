import { Avatar } from "@/components/Avatar";
import { CopyButton } from "@/components/CopyButton";
import { ProfileForm } from "@/components/ProfileForm";
import { memberName } from "@/lib/entries";
import { getMembers, requireHousehold } from "@/lib/household";
import { signOut } from "../../login/actions";
import { renameHousehold } from "../actions";

export default async function SettingsPage() {
  const { supabase, userId, household } = await requireHousehold();
  const members = await getMembers(supabase);
  const me = members.find((member) => member.user_id === userId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Innstillingar</h1>

      <ProfileForm displayName={me?.display_name ?? null} avatar={me?.avatar ?? null} />

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold">Medlemmer</h2>
        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li key={member.user_id} className="flex items-center gap-3">
              <Avatar name={memberName(member, userId)} src={member.avatar} size={32} />
              {memberName(member, userId)}
            </li>
          ))}
        </ul>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-semibold">Inviter partnaren</h2>
        <p className="text-sm text-muted">
          Partnaren opprettar konto og skriv inn denne koden for å sjå det same som deg.
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
