import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lenkja i stadfestings-e-posten landar her: byt koden mot ei økt
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("error", "Lenkja er ugyldig eller utgått. Prøv å logge inn.");
  return NextResponse.redirect(url);
}
