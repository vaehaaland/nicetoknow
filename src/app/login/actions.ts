"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Les e-post + passord frå skjemaet
function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

const fail = (message: string, mode?: string): never =>
  redirect(`/login?${new URLSearchParams({ error: message, ...(mode ? { mode } : {}) })}`);

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials(formData));
  if (error) fail("Feil e-post eller passord.");
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    ...credentials(formData),
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) fail(error.message, "signup");

  // Utan økt krev prosjektet e-poststadfesting først
  if (!data.session) {
    redirect(`/login?${new URLSearchParams({ info: "Sjekk e-posten din for å stadfeste kontoen." })}`);
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
