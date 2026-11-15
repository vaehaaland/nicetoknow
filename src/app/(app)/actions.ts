"use server";

import { revalidatePath } from "next/cache";
import { toEntryValues } from "@/lib/entries";
import { createClient, getUserId } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

// Tom streng → null, slik at valfrie felt ikkje blir lagra som ""
const optional = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim() || null;

// Felles avslutning for mutasjonar: oversett feil og oppdater oversikta
function finish(error: { message: string } | null): ActionResult {
  if (error) return { error: "Kunne ikkje lagre. Prøv igjen." };
  revalidatePath("/");
  return {};
}

// Opprettar ny oppføring, eller oppdaterer når skjemaet har ein id
export async function saveEntry(formData: FormData): Promise<ActionResult> {
  const values = toEntryValues(Object.fromEntries(formData));
  if (!values) return { error: "Kategori og tittel må fyllast ut." };

  const supabase = await createClient();
  const id = optional(formData, "id");
  // household_id og created_by blir sette av databasen; RLS avgrensar til eigen husstand
  const { error } = id
    ? await supabase.from("entries").update(values).eq("id", id)
    : await supabase.from("entries").insert(values);
  return finish(error);
}

const MAX_BATCH = 50;

// Lagrar fleire nye oppføringar på éin gong (forslag frå chatten som brukaren har godkjent).
// Forslaga kjem frå klienten og blir difor vaska på nytt her.
export async function saveEntries(drafts: unknown): Promise<ActionResult> {
  const values = (Array.isArray(drafts) ? drafts : [])
    .slice(0, MAX_BATCH)
    .map(toEntryValues)
    .filter((value) => value !== null);
  if (values.length === 0) return { error: "Ingenting å lagre." };

  const supabase = await createClient();
  const { error } = await supabase.from("entries").insert(values);
  return finish(error);
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  return finish(error);
}

const MAX_AVATAR_CHARS = 200_000;

// Lagrar namn og (valfritt) nytt profilbilete på eiga medlemsrad
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const avatar = optional(formData, "avatar");
  if (avatar && (!avatar.startsWith("data:image/") || avatar.length > MAX_AVATAR_CHARS)) {
    return { error: "Biletet er ugyldig eller for stort." };
  }

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return { error: "Ikkje innlogga." };

  const { error } = await supabase
    .from("household_members")
    // Utan nytt bilete blir det gamle ståande
    .update({ display_name: optional(formData, "display_name"), ...(avatar ? { avatar } : {}) })
    .eq("user_id", userId);
  if (error) return { error: "Kunne ikkje lagre profilen." };
  revalidatePath("/", "layout");
  return {};
}

export async function renameHousehold(formData: FormData) {
  const name = optional(formData, "name");
  if (!name) return;
  const supabase = await createClient();
  // RLS gjer at berre eigen husstand kan treffast
  await supabase.from("households").update({ name }).eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}
