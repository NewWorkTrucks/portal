import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_DATA_MODE } from "@/constants/data-mode";
import { getSupabaseConfig } from "@/lib/supabase/config";

// Pages a signed-out visitor may open in live mode.
const PUBLIC_PATH_PREFIXES = ["/login", "/auth/", "/robots.txt"];

/**
 * Keeps the Supabase session cookie fresh on every page request (live mode), and sends
 * signed-out visitors to /login so they don't see the portal's screens. Mock mode and setups
 * without Supabase settings pass straight through. Data access itself is enforced by RLS.
 */
export async function proxy(request: NextRequest) {
  const supabaseConfig = getSupabaseConfig();
  let response = NextResponse.next({ request });

  if (DEFAULT_DATA_MODE !== "live" || !supabaseConfig) {
    return response;
  }

  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refreshes the session if it expired. Must run before the response is returned.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Keep any refreshed or cleared session cookies.
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

export const config = {
  // Skip static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
