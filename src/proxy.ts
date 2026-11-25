import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_DATA_MODE } from "@/constants/data-mode";
import { getRequestIpAddress, writeAccessLogEntry } from "@/lib/access-log-writer";
import { isPhoneUserAgent } from "@/lib/phone-user-agent";
import { getSupabaseConfig } from "@/lib/supabase/config";

// Where phone visitors are shown the notice instead of the portal (US-9.1).
const WEB_BROWSER_ONLY_PATH = "/web-browser-only";

// Pages a signed-out visitor may open in live mode.
const PUBLIC_PATH_PREFIXES = ["/login", "/auth/", "/robots.txt", WEB_BROWSER_ONLY_PATH];

/**
 * Runs before every page. Phones get the web-browser notice (US-9.1) before anything else. In live
 * mode it logs each page load with the visitor's IP, user and time (US-9.3), then keeps the Supabase
 * session cookie fresh and sends signed-out visitors to /login. Mock mode and setups without Supabase
 * settings skip the sign-in and logging. Data access itself is enforced by RLS.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") ?? "";
  // Page loads only: asset, prefetch and data requests would flood the log without adding a visit.
  const isPageLoad = request.headers.get("sec-fetch-dest") === "document";
  const supabaseConfig = getSupabaseConfig();
  const isLiveMode = DEFAULT_DATA_MODE === "live" && supabaseConfig !== null;
  let response = NextResponse.next({ request });

  if (isPhoneUserAgent(userAgent) && pathname !== WEB_BROWSER_ONLY_PATH && pathname !== "/robots.txt") {
    if (isLiveMode && isPageLoad) {
      await writeAccessLogEntry({
        userId: null,
        ipAddress: getRequestIpAddress(request.headers),
        path: pathname,
        method: request.method,
        userAgent,
        outcome: "blocked-phone",
      });
    }
    return NextResponse.rewrite(new URL(WEB_BROWSER_ONLY_PATH, request.url));
  }

  if (!isLiveMode) {
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

  if (isPageLoad) {
    await writeAccessLogEntry({
      userId: user?.id ?? null,
      ipAddress: getRequestIpAddress(request.headers),
      path: pathname,
      method: request.method,
      userAgent,
      outcome: "allowed",
    });
  }

  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
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
