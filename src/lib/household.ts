import { redirect } from "next/navigation";
import { MEMBER_COLUMNS, type Member } from "@/lib/entries";
import { createClient, getUserId } from "@/lib/supabase/server";

export type Household = { id: string; name: string; invite_code: string };

// Innlogga brukar + husstanden hens. RLS gjer at berre eigen husstand er synleg.
export async function getSessionContext() {
  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) redirect("/login");

  const { data: household } = await supabase
    .from("households")
    .select("id, name, invite_code")
    .maybeSingle<Household>();

  return { supabase, userId, household };
}

// Medlemmene i eigen husstand (RLS avgrensar), eldste først
export async function getMembers(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("household_members")
    .select(MEMBER_COLUMNS)
    .order("joined_at")
    .returns<Member[]>();
  return data ?? [];
}

// Som over, men krev at brukaren har ein husstand
export async function requireHousehold() {
  const context = await getSessionContext();
  if (!context.household) redirect("/onboarding");
  return { ...context, household: context.household };
}
