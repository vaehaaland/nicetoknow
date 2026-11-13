import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// Supabase-klient for Server Components, Server Actions og Route Handlers
export async function createClient() {
  // Alt som brukar Supabase er per førespurnad. connection() held det utanfor prerendering og
  // førehandshenting, der auth-klienten elles les Date.now() og Next.js loggar ein feil.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Kalla frå ein Server Component: proxy.ts fornyar økta, så dette kan ignorerast.
        }
      },
    },
  });
}

// Verifisert brukar-ID (frå JWT-en), eller null om ingen er innlogga
export async function getUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}
