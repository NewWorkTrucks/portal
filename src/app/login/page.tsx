import type { Metadata } from "next";
import { Suspense } from "react";
import SignInPanel from "@/components/auth/sign-in-panel";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      {/* The panel reads ?error= from the URL, so it renders on the client. */}
      <Suspense fallback={null}>
        <SignInPanel />
      </Suspense>
    </main>
  );
}
