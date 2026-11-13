"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Feilkodar frå RPC-ane → tekst til brukaren
const ERRORS: Record<string, string> = {
  invalid_code: "Fann ingen husstand med den koden.",
  already_member: "Du er allereie med i ein husstand.",
};

type Rpc = { fn: "create_household"; args: { p_name: string } } | { fn: "join_household"; args: { p_code: string } };

// Felles køyring for både «opprett» og «bli med»
async function runHouseholdRpc({ fn, args }: Rpc) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) {
    const message = ERRORS[error.message] ?? "Noko gjekk gale. Prøv igjen.";
    redirect(`/onboarding?${new URLSearchParams({ error: message })}`);
  }
  redirect("/");
}

export async function createHousehold(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  await runHouseholdRpc({ fn: "create_household", args: { p_name: name || "Heime" } });
}

export async function joinHousehold(formData: FormData) {
  await runHouseholdRpc({ fn: "join_household", args: { p_code: String(formData.get("code") ?? "") } });
}
