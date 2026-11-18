import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

/** Where Google and the email link send people back after signing in (live mode). */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Only same-site paths, so the link can't redirect somewhere else.
  const requestedNextPath = requestUrl.searchParams.get("next") ?? "/kanban";
  const nextPath = requestedNextPath.startsWith("/") && !requestedNextPath.startsWith("//")
    ? requestedNextPath
    : "/kanban";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=sign-in-failed", requestUrl.origin));
}
