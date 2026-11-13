import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

// Sider som er opne utan innlogging
const PUBLIC_PATHS = ["/login", "/auth"];

// Fornyar auth-økta på kvar førespurnad og sender uinnlogga brukarar til /login
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Ikkje legg kode mellom createServerClient og getClaims – då kan økta kome ut av synk.
  const { data } = await supabase.auth.getClaims();
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!data?.claims && !isPublic) {
    // API-ruter får 401 i staden for ei HTML-omdirigering
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Ikkje innlogga" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
