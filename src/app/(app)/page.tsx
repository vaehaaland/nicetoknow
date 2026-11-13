import { EntryBrowser } from "@/components/EntryBrowser";
import { ENTRY_COLUMNS, type Entry } from "@/lib/entries";
import { getMembers, requireHousehold } from "@/lib/household";

export default async function HomePage() {
  const { supabase, userId } = await requireHousehold();
  // RLS avgrensar til eigen husstand; nyaste først
  const [{ data }, members] = await Promise.all([
    supabase.from("entries").select(ENTRY_COLUMNS).order("updated_at", { ascending: false }).returns<Entry[]>(),
    getMembers(supabase),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  return <EntryBrowser entries={data ?? []} members={members} currentUserId={userId} today={today} />;
}
