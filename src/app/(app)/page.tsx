import { EntryBrowser } from "@/components/EntryBrowser";
import { ENTRY_COLUMNS, type Entry } from "@/lib/entries";
import { requireHousehold } from "@/lib/household";

export default async function HomePage() {
  const { supabase } = await requireHousehold();
  // RLS avgrensar til eigen husstand; nyaste først
  const { data } = await supabase
    .from("entries")
    .select(ENTRY_COLUMNS)
    .order("updated_at", { ascending: false })
    .returns<Entry[]>();

  const today = new Date().toISOString().slice(0, 10);
  return <EntryBrowser entries={data ?? []} today={today} />;
}
