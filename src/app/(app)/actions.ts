"use server";

import { revalidatePath } from "next/cache";
import { isCategory } from "@/lib/entries";
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
  const category = formData.get("category");
  const title = optional(formData, "title");
  if (!isCategory(category) || !title) return { error: "Kategori og tittel må fyllast ut." };

  const values = {
    category,
    title,
    provider: optional(formData, "provider"),
    code: optional(formData, "code"),
    url: optional(formData, "url"),
    notes: optional(formData, "notes"),
    expires_at: optional(formData, "expires_at"),
    // Framandnøklane i databasen sikrar at begge peikar innanfor eigen husstand
    parent_id: optional(formData, "parent_id"),
    owner_id: optional(formData, "owner_id"),
    tags: (optional(formData, "tags") ?? "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
  };

  const supabase = await createClient();
  const id = optional(formData, "id");
  // household_id og created_by blir sette av databasen; RLS avgrensar til eigen husstand
  const { error } = id
    ? await supabase.from("entries").update(values).eq("id", id)
    : await supabase.from("entries").insert(values);
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
