import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Keeps the Supabase session cookie fresh on every page request (live mode). Mock-only
 * setups without Supabase settings pass straight through. Access itself is enforced by RLS;
 * this only refreshes the session.
 */
export async function proxy(request: NextRequest) {
  const supabaseConfig = getSupabaseConfig();
  let response = NextResponse.next({ request });

  if (!supabaseConfig) {
    return response;
  }

  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
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
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
