"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithPassword } from "@/api/auth";
import { useDataMode } from "@/components/data-mode-provider";
import EmailSignInForm from "@/components/forms/email-sign-in-form";
import PasswordSignInForm from "@/components/forms/password-sign-in-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

// Email and password is the only sign-in for now. Set these to true to offer the others again.
// Google needs its provider set up in Supabase (nwt-server: docs/google-sign-in-setup.md).
const IS_GOOGLE_SIGN_IN_ENABLED = false;
// Email links need custom SMTP in Supabase: the built-in sender allows only a few emails an hour.
const IS_EMAIL_LINK_SIGN_IN_ENABLED = false;

const SIGN_IN_ERROR_MESSAGES: Record<string, string> = {
  "sign-in-failed": "That sign-in link didn't work or has expired. Try again.",
};

function getAuthCallbackUrl(): string {
  return `${window.location.origin}/auth/callback?next=/kanban`;
}

/**
 * Email and password sign-in, with Google and email links available behind flags (E4-3).
 * Mock mode needs no sign-in.
 */
export default function SignInPanel() {
  const { dataMode } = useDataMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();

  const [googleError, setGoogleError] = useState<string | null>(null);

  const callbackError = SIGN_IN_ERROR_MESSAGES[searchParams.get("error") ?? ""];

  async function handleClickGoogleSignIn() {
    if (!supabase) {
      return;
    }
    setGoogleError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // TODO: Limit to the company's Google Workspace domain (hd) once it's confirmed.
      options: { redirectTo: getAuthCallbackUrl() },
    });
    if (error) {
      setGoogleError(error.message);
    }
  }

  async function handleSubmitPasswordSignIn(
    email: string,
    password: string,
  ): Promise<string | null> {
    const errorMessage = await signInWithPassword(email, password);
    if (!errorMessage) {
      router.replace("/kanban");
      // Re-render server components with the new session cookie.
      router.refresh();
    }
    return errorMessage;
  }

  async function handleSubmitEmailSignIn(
    email: string,
  ): Promise<string | null> {
    if (!supabase) {
      return "Sign-in isn't set up.";
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthCallbackUrl() },
    });
    return error?.message ?? null;
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2 font-heading text-sm font-semibold">
          <LayoutDashboard aria-hidden className="size-4 text-primary" />
          FFL Operations Portal
        </span>
        <h1 className="font-heading text-xl font-semibold">Sign in</h1>
      </div>

      {dataMode === "mock" ? (
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-muted-foreground">
            The portal is in mock mode, which uses sample data and needs no
            sign-in.
          </p>
          <Link
            href="/kanban"
            className={buttonVariants({ className: "w-fit" })}
          >
            Go to the board
          </Link>
        </div>
      ) : !supabase ? (
        <p className="text-sm text-muted-foreground">
          Live mode isn&rsquo;t set up: add the Supabase settings to{" "}
          <code>.env</code> (see <code>.env.example</code>).
        </p>
      ) : (
        <>
          {callbackError && (
            <p role="alert" className="text-sm text-destructive">
              {callbackError}
            </p>
          )}
          <PasswordSignInForm onSubmit={handleSubmitPasswordSignIn} />
          {(IS_GOOGLE_SIGN_IN_ENABLED || IS_EMAIL_LINK_SIGN_IN_ENABLED) && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          )}
          {IS_GOOGLE_SIGN_IN_ENABLED && (
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" onClick={handleClickGoogleSignIn}>
                <svg aria-hidden viewBox="0 0 24 24" className="size-4">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1H12v2.98h5.38c-.24 1.36-1.62 3.98-5.38 3.98-3.24 0-5.88-2.68-5.88-5.98S8.76 6.1 12 6.1c1.84 0 3.08.78 3.78 1.46l2.58-2.48C16.7 3.54 14.56 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12s4.2 9.4 9.4 9.4c5.42 0 9.02-3.8 9.02-9.16 0-.62-.06-1.08-.15-1.54z"
                  />
                </svg>
                Continue with Google
              </Button>
              {googleError && (
                <p role="alert" className="text-xs text-destructive">
                  {googleError}
                </p>
              )}
            </div>
          )}
          {IS_EMAIL_LINK_SIGN_IN_ENABLED && (
            <EmailSignInForm onSubmit={handleSubmitEmailSignIn} />
          )}
        </>
      )}
    </div>
  );
}
